import '/components/button6_widget.dart';
import '/components/settings_item_widget.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'profile_widget.dart' show ProfileWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ProfileModel extends FlutterFlowModel<ProfileWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for SettingsItem.
  late SettingsItemModel settingsItemModel1;
  // Model for SettingsItem.
  late SettingsItemModel settingsItemModel2;
  // Model for SettingsItem.
  late SettingsItemModel settingsItemModel3;
  // Model for SettingsItem.
  late SettingsItemModel settingsItemModel4;
  // Model for SettingsItem.
  late SettingsItemModel settingsItemModel5;
  // Model for Button.
  late Button6Model buttonModel;

  @override
  void initState(BuildContext context) {
    settingsItemModel1 = createModel(context, () => SettingsItemModel());
    settingsItemModel2 = createModel(context, () => SettingsItemModel());
    settingsItemModel3 = createModel(context, () => SettingsItemModel());
    settingsItemModel4 = createModel(context, () => SettingsItemModel());
    settingsItemModel5 = createModel(context, () => SettingsItemModel());
    buttonModel = createModel(context, () => Button6Model());
  }

  @override
  void dispose() {
    settingsItemModel1.dispose();
    settingsItemModel2.dispose();
    settingsItemModel3.dispose();
    settingsItemModel4.dispose();
    settingsItemModel5.dispose();
    buttonModel.dispose();
  }
}
