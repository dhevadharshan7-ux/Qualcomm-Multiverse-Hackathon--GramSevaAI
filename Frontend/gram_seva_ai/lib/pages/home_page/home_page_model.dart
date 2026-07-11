import '/components/button_widget.dart';
import '/components/feature_item_widget.dart';
import '/components/lang_chip_widget.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'home_page_widget.dart' show HomePageWidget;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class HomePageModel extends FlutterFlowModel<HomePageWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for LangChip.
  late LangChipModel langChipModel1;
  // Model for LangChip.
  late LangChipModel langChipModel2;
  // Model for LangChip.
  late LangChipModel langChipModel3;
  // Model for LangChip.
  late LangChipModel langChipModel4;
  // Model for LangChip.
  late LangChipModel langChipModel5;
  // Model for FeatureItem.
  late FeatureItemModel featureItemModel1;
  // Model for FeatureItem.
  late FeatureItemModel featureItemModel2;
  // Model for FeatureItem.
  late FeatureItemModel featureItemModel3;
  // Model for Button.
  late ButtonModel buttonModel;

  @override
  void initState(BuildContext context) {
    langChipModel1 = createModel(context, () => LangChipModel());
    langChipModel2 = createModel(context, () => LangChipModel());
    langChipModel3 = createModel(context, () => LangChipModel());
    langChipModel4 = createModel(context, () => LangChipModel());
    langChipModel5 = createModel(context, () => LangChipModel());
    featureItemModel1 = createModel(context, () => FeatureItemModel());
    featureItemModel2 = createModel(context, () => FeatureItemModel());
    featureItemModel3 = createModel(context, () => FeatureItemModel());
    buttonModel = createModel(context, () => ButtonModel());
  }

  @override
  void dispose() {
    langChipModel1.dispose();
    langChipModel2.dispose();
    langChipModel3.dispose();
    langChipModel4.dispose();
    langChipModel5.dispose();
    featureItemModel1.dispose();
    featureItemModel2.dispose();
    featureItemModel3.dispose();
    buttonModel.dispose();
  }
}
