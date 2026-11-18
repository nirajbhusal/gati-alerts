import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../preferences/app_preferences.dart';
import 'app_language.dart';

final stringsProvider = Provider<AppStrings>(
  (ref) => AppStrings(ref.watch(languageProvider)),
);

/// Interface text. Data text comes translated from the JSON itself.
class AppStrings {
  const AppStrings(this.lang);

  final AppLanguage lang;

  String _t(String ne, String en) => lang == AppLanguage.ne ? ne : en;

  // App
  String get appName => _t('गति', 'Gati');
  String get tagline =>
      _t('सही सूचना, सही समयमा ।', 'The right alert, right on time.');
  String get disclaimer => _t(
    'गतिले आफैं चेतावनी जारी गर्दैन। यसले सरकारी निकायका सूचना स्रोत र समयसहित पुनः प्रकाशित गर्छ।',
    'Gati does not issue warnings. It relays official notices with their source and time.',
  );

  // Tabs
  String get alerts => _t('सूचना', 'Alerts');
  String get weather => _t('मौसम', 'Weather');
  String get roads => _t('सडक', 'Roads');
  String get rivers => _t('नदी', 'Rivers');
  String get contacts => _t('आपतकालीन', 'Emergency');
  String get settings => _t('सेटिङ', 'Settings');

  // Common
  String get all => _t('सबै', 'All');
  String get active => _t('सक्रिय', 'Active');
  String get allNepal => _t('सबै नेपाल', 'All Nepal');
  String get myDistrict => _t('मेरो जिल्ला', 'My district');
  String get chooseDistrict => _t('जिल्ला छान्नुहोस्', 'Choose district');
  String get searchDistrict => _t('जिल्ला खोज्नुहोस्', 'Search district');
  String get source => _t('स्रोत', 'Source');
  String get openSource => _t('मूल स्रोत हेर्नुहोस्', 'Open original source');
  String get openOnWeb => _t('गतिमा हेर्नुहोस्', 'Open on Gati');
  String get checked => _t('जाँचेको', 'Checked');
  String get retry => _t('फेरि प्रयास गर्नुहोस्', 'Try again');
  String get nothingHere => _t('यहाँ केही छैन।', 'Nothing here.');

  // Errors
  String get errorNetwork => _t(
    'इन्टरनेट जडान भएन। जडान जाँचेर फेरि प्रयास गर्नुहोस्।',
    'Could not connect. Check your internet and try again.',
  );
  String get errorServer =>
      _t('सर्भरबाट डेटा आएन।', 'The server did not return data.');
  String get errorParse =>
      _t('डेटा पढ्न सकिएन।', 'The data could not be read.');

  // Alerts
  String get activeAlerts => _t('सक्रिय सूचना', 'Active alerts');
  String get severeAlerts => _t('गम्भीर', 'Severe');
  String get noActiveAlerts =>
      _t('अहिले कुनै सक्रिय सूचना छैन।', 'No active alerts right now.');
  String get sent => _t('जारी', 'Issued');
  String get expires => _t('म्याद', 'Expires');
  String get expired => _t('म्याद सकियो', 'Expired');
  String get area => _t('क्षेत्र', 'Area');
  String get details => _t('विवरण', 'Details');
  String get whatToDo => _t('के गर्ने', 'What to do');
  String get issuedBy => _t('जारी गर्ने निकाय', 'Issued by');
  String get laterUpdated =>
      _t('यो सूचना पछि अद्यावधिक भएको छ।', 'This notice was later updated.');
  String get seeLatest => _t('पछिल्लो संस्करण', 'Latest version');

  // Weather
  String get fiveDayWarning => _t('पाँच दिने चेतावनी', '5-day warning');
  String get forecast24 => _t('२४ घण्टाको पूर्वानुमान', '24-hour forecast');
  String get day => _t('दिन', 'Day');
  String get night => _t('रात', 'Night');

  // Rivers
  String get level => _t('सतह', 'Level');
  String get warningLevel => _t('चेतावनी तह', 'Warning');
  String get dangerLevel => _t('खतरा तह', 'Danger');
  String get normal => _t('सामान्य', 'Normal');
  String get aboveWarning => _t('चेतावनी तहमाथि', 'Above warning');
  String get aboveDanger => _t('खतरा तहमाथि', 'Above danger');

  // Contacts
  String get nationalNumbers => _t('राष्ट्रिय नम्बर', 'National numbers');
  String get districtNumbers => _t('जिल्लाका नम्बर', 'District numbers');
  String get noDistrictNumbers =>
      _t('यो जिल्लाका नम्बर अहिले छैनन्।', 'No numbers for this district yet.');

  // Settings
  String get language => _t('भाषा', 'Language');
  String get theme => _t('रङ', 'Theme');
  String get themeSystem => _t('स्वतः', 'Auto');
  String get themeLight => _t('उज्यालो', 'Light');
  String get themeDark => _t('अँध्यारो', 'Dark');
  String get about => _t('बारेमा', 'About');
  String get website => _t('वेबसाइट', 'Website');
}
