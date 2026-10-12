import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/publication_service.dart';
import '../services/auth_service.dart';
import '../models/publication_model.dart';
import '../widgets/publication_card.dart';
import '../widgets/story_viewer.dart';
import 'monetization_request_screen.dart';

class PublicationsScreen extends StatefulWidget {
  const PublicationsScreen({super.key});

  @override
  State<PublicationsScreen> createState() => _PublicationsScreenState();
}

class _PublicationsScreenState extends State<PublicationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Publications'),
        bottom: TabBar(
          controller: _tab,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(icon: Icon(Icons.auto_stories), text: 'Stories'),
            Tab(icon: Icon(Icons.videocam), text: 'Vidéos'),
            Tab(icon: Icon(Icons.photo), text: 'Photos'),
          ],
        ),
        actions: [
          if (user != null && !user.isMonetized)
            IconButton(
              icon: const Icon(Icons.monetization_on, color: Colors.amber),
              tooltip: 'Demander la monétisation',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const MonetizationRequestScreen()),
              ),
            ),
          if (user != null && user.isMonetized)
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Chip(
                avatar: Icon(Icons.verified, color: Colors.white, size: 16),
                label: Text('Monétisé',
                    style: TextStyle(color: Colors.white, fontSize: 11)),
                backgroundColor: Colors.green,
              ),
            ),
        ],
      ),
      body: TabBarView(
        controller: _tab,
        children: const [
          _Feed(type: 'story'),
          _Feed(type: 'video'),
          _Feed(type: 'photo'),
        ],
      ),
    );
  }
}

class _Feed extends StatelessWidget {
  final String type;
  const _Feed({required this.type});

  @override
  Widget build(BuildContext context) {
    final service = context.watch<PublicationService>();

    return StreamBuilder<List<PublicationModel>>(
      stream: service.getPublications(type),
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final pubs = snap.data ?? [];
        if (pubs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  type == 'story'
                      ? Icons.auto_stories
                      : type == 'video'
                          ? Icons.videocam
                          : Icons.photo,
                  size: 80,
                  color: Colors.grey,
                ),
                const SizedBox(height: 12),
                Text('Aucune $type pour le moment',
                    style: const TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }

        if (type == 'story') {
          return StoryViewer(stories: pubs);
        }

        return ListView.builder(
          itemCount: pubs.length,
          itemBuilder: (_, i) => PublicationCard(publication: pubs[i]),
        );
      },
    );
  }
}