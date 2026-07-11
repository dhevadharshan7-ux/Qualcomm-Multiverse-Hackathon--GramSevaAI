import '/components/grievance_card_widget.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'complaint_status_widget.dart' show ComplaintStatusWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class ComplaintStatusModel extends FlutterFlowModel<ComplaintStatusWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for GrievanceCard.
  late GrievanceCardModel grievanceCardModel1;
  // Model for GrievanceCard.
  late GrievanceCardModel grievanceCardModel2;
  // Model for GrievanceCard.
  late GrievanceCardModel grievanceCardModel3;

  @override
  void initState(BuildContext context) {
    grievanceCardModel1 = createModel(context, () => GrievanceCardModel());
    grievanceCardModel2 = createModel(context, () => GrievanceCardModel());
    grievanceCardModel3 = createModel(context, () => GrievanceCardModel());
  }

  @override
  void dispose() {
    grievanceCardModel1.dispose();
    grievanceCardModel2.dispose();
    grievanceCardModel3.dispose();
  }
}
