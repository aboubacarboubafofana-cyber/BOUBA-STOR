"use client"
import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getAuth } from "firebase/auth"

// CONFIG FIREBASE - remplace par tes clés
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "bouba-store.firebaseapp.com",
  projectId: "bouba-store",
  storageBucket: "bouba-store.appspot.com",
  messagingSenderId: "...",
  appId: "..."
}
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)
const auth = getAuth(app)

export default function BoubaVibes() {
  const [posts, setPosts] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState("photo")
  const [loading, setLoading] = useState(false)

  // CHARGER FEED EN TEMPS RÉEL
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id,...d.data() })))
    })
    const q2 = query(collection(db, "stories"), orderBy("createdAt", "desc"))
    const unsub2 = onSnapshot(q2, (snap) => {
      // Filtrer stories < 24h
      const now = Date.now()
      setStories(snap.docs.map(d => ({ id: d.id,...d.data() })).filter((s:any) => now - s.createdAt?.toMillis() < 86400000))
    })
    return () => { unsub(); unsub2() }
  }, [])

  // CRÉER PUBLICATION
  const handlePost = async () => {
    if (!file &&!caption) return alert("Ajoute photo/vidéo ou texte")
    setLoading(true)
    try {
      let mediaUrl = ""
      if (file) {
        const storageRef = ref(storage, `vibes/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        mediaUrl = await getDownloadURL(storageRef)
      }
      const col = type === "story"? "stories" : "posts"
      await addDoc(collection(db, col), {
        userId: auth.currentUser?.uid || "anon",
        username: auth.currentUser?.displayName || "Bouba User",
        caption,
        mediaUrl,
        type,
        likes: 0,
        views: 0,
        comments: 0,
        createdAt: serverTimestamp()
      })
      setCaption(""); setFile(null); alert("Publié! 🚀")
    } catch (e) { console.error(e); alert("Erreur") }
    setLoading(false)
  }

  const likePost = async (id: string) => {
    await updateDoc(doc(db, "posts", id), { likes: increment(1) })
  }

  // DEMANDE MONÉTISATION -> WHATSAPP + FIREBASE
  const [showMono, setShowMono] = useState(false)
  const [monoData, setMonoData] = useState({ name: "", number: "", type: "Wave" })

  const sendMonetization = async () => {
    if (!monoData.name ||!monoData.number) return alert("Remplis tout")
    await addDoc(collection(db, "monetization_requests"), {
     ...monoData,
      userId: auth.currentUser?.uid,
      username: auth.currentUser?.displayName,
      status: "pending",
      createdAt: serverTimestamp()
    })
    // Envoi WhatsApp direct
    const msg = `NOUVELLE DEMANDE MONÉTISATION%0APseudo: ${auth.currentUser?.displayName}%0ANom: ${monoData.name}%0ANuméro ${monoData.type}: ${monoData.number}%0AProfil: bouba-stor.vercel.app/vibes`
    window.open(`https://wa.me/2250787619717?text=${msg}`, "_blank")
    setShowMono(false)
    alert("Demande envoyée! Je vais activer ta monétisation sous 24h")
  }

  return (
    <div className="min-h-screen bg-black text-white p-2 max-w-[500px] mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center p-3 border-b border-yellow-600/30">
        <h1 className="text-xl font-bold text-yellow-500">BOUBA VIBES ✨</h1>
        <button onClick={() => setShowMono(true)} className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">💰 Monétiser</button>
      </div>

      {/* STORIES */}
      <div className="flex gap-3 overflow-x-auto p-3">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500 p-[2px]"><div className="bg-black rounded-full w-full h-full flex items-center justify-center">+</div></div>
          <span className="text-xs">Ta story</span>
        </div>
        {stories.map(s => (
          <div key={s.id} className="flex flex-col items-center min-w-[60px]">
            <img src={s.mediaUrl} className="w-14 h-14 rounded-full border-2 border-yellow-500 object-cover" />
            <span className="text-xs truncate w-14">{s.username}</span>
          </div>
        ))}
      </div>

      {/* CRÉATION POST */}
      <div className="bg-zinc-900 rounded-xl p-3 m-2">
        <select value={type} onChange={e => setType(e.target.value)} className="bg-black border border-yellow-600 rounded p-2 w-full mb-2 text-sm">
          <option value="photo">📸 Photo</option>
          <option value="video">🎥 Vidéo/Reel</option>
          <option value="story">⚡ Story 24h</option>
        </select>
        <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm mb-2" />
        <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Quoi de neuf à Abidjan? #BoubaStore" className="w-full bg-black border border-zinc-700 rounded p-2 text-sm" rows={2}></textarea>
        <button onClick={handlePost} disabled={loading} className="w-full bg-yellow-500 text-black font-bold py-2 rounded-full mt-2">{loading? "Publication..." : "Publier 🚀"}</button>
      </div>

      {/* FEED */}
      <div className="space-y-4 p-2">
        {posts.map(p => (
          <div key={p.id} className="bg-zinc-900 rounded-xl overflow-hidden">
            <div className="p-3 flex justify-between">
              <span className="font-bold text-sm">@{p.username}</span>
              <span className="text-xs text-zinc-400">{p.type}</span>
            </div>
            {p.mediaUrl && (p.type === "video"? <video src={p.mediaUrl} controls className="w-full" /> : <img src={p.mediaUrl} className="w-full object-cover max-h-[500px]" />)}
            <div className="p-3">
              <p className="text-sm mb-2">{p.caption}</p>
              <div className="flex gap-4 text-sm">
                <button onClick={() => likePost(p.id)}>❤️ {p.likes} Likes</button>
                <span>👁️ {p.views} Vues</span>
                <a href={`https://wa.me/2250787619717?text=Je veux ce look: bouba-stor.vercel.app/vibes`} className="ml-auto bg-green-600 px-2 py-1 rounded text-xs">WhatsApp</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL MONÉTISATION */}
      {showMono && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-xl p-5 w-full max-w-sm border border-yellow-600">
            <h2 className="font-bold text-yellow-500 mb-3">💰 Monétiser ton compte</h2>
            <input placeholder="Nom complet" value={monoData.name} onChange={e => setMonoData({...monoData, name: e.target.value})} className="w-full bg-black border rounded p-2 mb-2 text-sm" />
            <select value={monoData.type} onChange={e => setMonoData({...monoData, type: e.target.value})} className="w-full bg-black border rounded p-2 mb-2 text-sm">
              <option>Wave</option><option>Orange Money</option>
            </select>
            <input placeholder="Numéro Wave / OM" value={monoData.number} onChange={e => setMonoData({...monoData, number: e.target.value})} className="w-full bg-black border rounded p-2 mb-3 text-sm" />
            <p className="text-xs text-zinc-400 mb-3">Paiement direct sur Wave/OM. Plus de visibilité = plus d'argent. 1K vues = 500F</p>
            <div className="flex gap-2">
              <button onClick={() => setShowMono(false)} className="flex-1 bg-zinc-700 py-2 rounded">Annuler</button>
              <button onClick={sendMonetization} className="flex-1 bg-yellow-500 text-black font-bold py-2 rounded">Envoyer demande</button>
            </div>
          </div>
        </div>
      )}

      {/* NAV BAS */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-yellow-600/30 flex justify-around p-3 max-w-[500px] mx-auto">
        <span>🏠 Boutique</span><span className="text-yellow-500 font-bold">📸 Vibes</span><span>🎡 Roue</span><span>👤 Profil</span>
      </div>
    </div>
  )
}