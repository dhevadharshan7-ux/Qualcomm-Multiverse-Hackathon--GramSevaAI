import '/components/button3_widget.dart';
import '/components/status_badge_widget.dart';
import '/components/success_detail_row_widget.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'submission_widget.dart' show SubmissionWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class SubmissionModel extends FlutterFlowModel<SubmissionWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for StatusBadge.
  late StatusBadgeModel statusBadgeModel;
  // Model for SuccessDetailRow.
  late SuccessDetailRowModel successDetailRowModel1;
  // Model for SuccessDetailRow.
  late SuccessDetailRowModel successDetailRowModel2;
  // Model for SuccessDetailRow.
  late SuccessDetailRowModel successDetailRowModel3;
  // Model for SuccessDetailRow.
  late SuccessDetailRowModel successDetailRowModel4;
  // Model for Button.
  late Button3Model buttonModel1;
  // Model for Button.
  late Button3Model buttonModel2;

  @override
  void initState(BuildContext context) {
    statusBadgeModel = createModel(context, () => StatusBadgeModel());
    successDetailRowModel1 =
        createModel(context, () => SuccessDetailRowModel());
    successDetailRowModel2 =
        createModel(context, () => SuccessDetailRowModel());
    successDetailRowModel3 =
        createModel(context, () => SuccessDetailRowModel());
    successDetailRowModel4 =
        createModel(context, () => SuccessDetailRowModel());
    buttonModel1 = createModel(context, () => Button3Model());
    buttonModel2 = createModel(context, () => Button3Model());
  }

  @override
  void dispose() {
    statusBadgeModel.dispose();
    successDetailRowModel1.dispose();
    successDetailRowModel2.dispose();
    successDetailRowModel3.dispose();
    successDetailRowModel4.dispose();
    buttonModel1.dispose();
    buttonModel2.dispose();
  }
}
