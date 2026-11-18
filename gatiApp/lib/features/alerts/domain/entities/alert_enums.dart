/// CAP severity. [rank] orders them, higher is worse.
enum Severity {
  extreme(4),
  severe(3),
  moderate(2),
  minor(1),
  unknown(0);

  const Severity(this.rank);

  final int rank;

  static Severity parse(String v) => values.firstWhere(
    (s) => s.name == v.toLowerCase(),
    orElse: () => Severity.unknown,
  );
}

/// How sure Gati is about the item. Only official/verified are confirmed.
enum TrustLevel {
  official,
  verified,
  reported,
  unverified,
  model;

  bool get isConfirmed => this == official || this == verified;

  static TrustLevel parse(String v) => values.firstWhere(
    (t) => t.name == v.toLowerCase(),
    orElse: () => TrustLevel.unverified,
  );
}

enum Hazard {
  flood,
  landslide,
  road,
  weather,
  earthquake,
  airQuality,
  epidemic,
  other;

  static Hazard parse(String v) => switch (v) {
    'air-quality' => Hazard.airQuality,
    _ => values.firstWhere((h) => h.name == v, orElse: () => Hazard.other),
  };
}
