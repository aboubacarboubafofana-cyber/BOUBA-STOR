const CACHE_NAME = "bouba-store-v1";

const FILES = [
    "./",
    "./index.html",
    "./sw.js"
];

/* Installation */
self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME).then(cache => {

            return cache.addAll(FILES);

        })

    );

    self.skipWaiting();

});


/* Activation */
self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))

            );

        })

    );

    self.clients.claim();

});


/* Fonctionnement hors connexion */
self.addEventListener("fetch", event => {

    if(event.request.method !== "GET"){
        return;
    }

    event.respondWith(

        fetch(event.request)

        .then(response => {

            const copie = response.clone();

            caches.open(CACHE_NAME).then(cache => {

                cache.put(
                    event.request,
                    copie
                );

            });

            return response;

        })

        .catch(() => {

            return caches.match(
                event.request
            );

        })

    );

});


/* Notifications */
self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        event.waitUntil(

            clients.matchAll({
                type:"window",
                includeUncontrolled:true
            }).then(liste => {

                if(liste.length){

                    return liste[0].focus();

                }

                return clients.openWindow("./");

            })

        );

    }
);