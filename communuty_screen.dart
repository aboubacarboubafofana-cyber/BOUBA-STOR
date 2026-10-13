import 'package:flutter/material.dart';
import 'community_service.dart';
import 'community_chat_screen.dart';

class CommunityScreen extends StatefulWidget {
  @override
  _CommunityScreenState createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final CommunityService _communityService = CommunityService();

  // Boîte de dialogue pour créer un groupe
  void _showCreateGroupDialog() {
    TextEditingController _groupNameController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Créer un nouveau groupe"),
          content: TextField(
            controller: _groupNameController,
            decoration: InputDecoration(hintText: "Nom du groupe"),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("Annuler"),
            ),
            ElevatedButton(
              onPressed: () async {
                if (_groupNameController.text.trim().isNotEmpty) {
                  await _communityService.createGroup(_groupNameController.text.trim());
                  Navigator.pop(context);
                }
              },
              child: Text("Créer"),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Communauté Internationale"),
        backgroundColor: Colors.deepPurple,
      ),
      body: StreamBuilder(
        stream: _communityService.getAllGroups(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator());
          }
          var groups = snapshot.data!.docs;
          if (groups.isEmpty) {
            return Center(child: Text("Aucun groupe pour le moment. Créez-en un !"));
          }
          return ListView.builder(
            itemCount: groups.length,
            itemBuilder: (context, index) {
              var group = groups[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.deepPurple,
                  child: Text(group['name'][0].toUpperCase(), style: TextStyle(color: Colors.white)),
                ),
                title: Text(group['name']),
                subtitle: Text("${group['members'].length} membres"),
                trailing: Icon(Icons.arrow_forward_ios),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CommunityChatScreen(
                        groupId: group.id,
                        groupName: group['name'],
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateGroupDialog,
        child: Icon(Icons.group_add),
        backgroundColor: Colors.deepPurple,
      ),
    );
  }
}