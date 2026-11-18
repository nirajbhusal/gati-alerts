import 'package:flutter_test/flutter_test.dart';
import 'package:gati_app/core/l10n/app_language.dart';
import 'package:gati_app/core/l10n/localized_text.dart';
import 'package:gati_app/core/utils/formatters.dart';
import 'package:gati_app/features/alerts/data/models/alert_model.dart';
import 'package:gati_app/features/alerts/domain/entities/alert_enums.dart';
import 'package:gati_app/features/rivers/domain/entities/river_report.dart';
import 'package:gati_app/features/roads/domain/entities/road_report.dart';

void main() {
  group('AlertModel', () {
    Map<String, dynamic> json({
      String? supersededBy,
      String msgType = 'Alert',
    }) => {
      'identifier': 'np.gati.test-1',
      'sent': '2026-11-18T09:25:00+05:45',
      'expires': '2026-11-22T23:59:00+05:45',
      'msgType': msgType,
      'trust': 'Official',
      'hazard': 'air-quality',
      'severity': 'Severe',
      'districts': ['NP0330'],
      'supersededBy': supersededBy,
      'areas': [
        {'ne': 'धादिङ', 'en': 'Dhading'},
      ],
      'info': {
        'ne': {'headline': 'शीर्षक', 'web': 'https://dhm.gov.np/'},
        'en': {'headline': 'Headline'},
      },
    };

    test('parses fields and enums', () {
      final a = AlertModel.fromJson(json());
      expect(a.id, 'np.gati.test-1');
      expect(a.trust, TrustLevel.official);
      expect(a.hazard, Hazard.airQuality);
      expect(a.severity, Severity.severe);
      expect(a.headline.of(AppLanguage.en), 'Headline');
      expect(a.areas.single.of(AppLanguage.ne), 'धादिङ');
      expect(a.sourceUrl, 'https://dhm.gov.np/');
      expect(a.concerns('NP0330'), isTrue);
      expect(a.concerns('NP0101'), isFalse);
    });

    test('active only before expiry, when not replaced or cancelled', () {
      final before = DateTime.utc(2026, 11, 20);
      final after = DateTime.utc(2026, 11, 23);
      expect(AlertModel.fromJson(json()).isActive(before), isTrue);
      expect(AlertModel.fromJson(json()).isActive(after), isFalse);
      expect(
        AlertModel.fromJson(json(supersededBy: 'x')).isActive(before),
        isFalse,
      );
      expect(
        AlertModel.fromJson(json(msgType: 'Cancel')).isActive(before),
        isFalse,
      );
    });

    test('unknown values fall back safely', () {
      final a = AlertModel.fromJson({'identifier': 'x', 'severity': '???'});
      expect(a.severity, Severity.unknown);
      expect(a.trust, TrustLevel.unverified);
      expect(a.hazard, Hazard.other);
    });
  });

  test('RiverGauge status against warning and danger levels', () {
    RiverGauge g(double level) => RiverGauge(
      name: LocalizedText.empty,
      districtSlug: '',
      level: level,
      warning: 5,
      danger: 8,
    );
    expect(g(3).status, RiverStatus.normal);
    expect(g(5).status, RiverStatus.aboveWarning);
    expect(g(9).status, RiverStatus.aboveDanger);
    expect(g(9).fill, 1);
  });

  test('RoadStatus.parse maps website values', () {
    expect(RoadStatus.parse('blocked'), RoadStatus.blocked);
    expect(RoadStatus.parse('oneway'), RoadStatus.oneway);
    expect(RoadStatus.parse('open'), RoadStatus.open);
    expect(RoadStatus.parse('none'), RoadStatus.unconfirmed);
  });

  group('Fmt', () {
    test('digits follow the language', () {
      expect(Fmt.digits('2083', AppLanguage.ne), '२०८३');
      expect(Fmt.digits('2083', AppLanguage.en), '2083');
    });

    test('dateTime is in Nepal Time', () {
      final t = DateTime.parse('2026-11-18T09:25:00+05:45');
      expect(Fmt.dateTime(t, AppLanguage.en), '18 Nov, 09:25');
      expect(Fmt.dateTime(t, AppLanguage.ne), '१८ नोभेम्बर, ०९:२५');
    });
  });
}
