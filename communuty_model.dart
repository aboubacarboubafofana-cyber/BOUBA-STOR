import 'package:cloud_firestore/cloud_firestore.dart';

class CommunityGroup {
  final String id;
  final String name;
  final String adminId;
  final List<String> members;
  final DateTime createdAt;

  CommunityGroup({
    required this.id,
    required this.name,
    required this.adminId,
    required this.members,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'adminId': adminId,
      'members': members,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  factory CommunityGroup.fromMap(Map<String, dynamic> map, String id) {
    return CommunityGroup(
      id: id,
      name: map['name'] ?? '',
      adminId: map['adminId'] ?? '',
      members: List<String>.from(map['members'] ?? []),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
    );
  }
}

class CommunityMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String text;
  final String type;
  final DateTime timestamp;

  CommunityMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.type,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'senderId': senderId,
      'senderName': senderName,
      'text': text,
      'type': type,
      'timestamp': Timestamp.fromDate(timestamp),
    };
  }

  factory CommunityMessage.fromMap(Map<String, dynamic> map, String id) {
    return CommunityMessage(
      id: id,
      senderId: map['senderId'] ?? '',
      senderName: map['senderName'] ?? 'Anonyme',
      text: map['text'] ?? '',
      type: map['type'] ?? 'text',
      timestamp: (map['timestamp'] as Timestamp).toDate(),
    );
  }
}