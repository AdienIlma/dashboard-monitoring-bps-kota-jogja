class UserModel {
  final int id;
  final String nama;
  final String username;
  final String role; // 'pml' atau 'ppl'
  final int? pmlId;

  UserModel({
    required this.id,
    required this.nama,
    required this.username,
    required this.role,
    this.pmlId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      nama: json['nama'] ?? '',
      username: json['username'] ?? '',
      role: (json['role'] ?? '').toString().toLowerCase(),
      pmlId: json['pml_id'] != null
          ? (json['pml_id'] is int ? json['pml_id'] : int.tryParse(json['pml_id'].toString()))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nama': nama,
      'username': username,
      'role': role,
      'pml_id': pmlId,
    };
  }
}
