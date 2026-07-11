import '/components/button4_widget.dart';
import '/components/status_badge2_widget.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'grievance_card_widget.dart' show GrievanceCardWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class GrievanceCardModel extends FlutterFlowModel<GrievanceCardWidget> {
  ///  State fields for stateful widgets in this component.

  // Model for StatusBadge.
  late StatusBadge2Model statusBadgeModel;
  // Model for Button.
  late Button4Model buttonModel;

  @override
  void initState(BuildContext context) {
    statusBadgeModel = createModel(context, () => StatusBadge2Model());
    buttonModel = createModel(context, () => Button4Model());
  }

  @override
  void dispose() {
    statusBadgeModel.dispose();
    buttonModel.dispose();
  }
}
