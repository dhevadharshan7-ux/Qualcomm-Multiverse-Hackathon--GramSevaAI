import '/components/button5_widget.dart';
import '/components/status_badge3_widget.dart';
import '/flutter_flow/flutter_flow_google_map.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'grievance_detail_widget.dart' show GrievanceDetailWidget;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class GrievanceDetailModel extends FlutterFlowModel<GrievanceDetailWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for StatusBadge.
  late StatusBadge3Model statusBadgeModel;
  // State field(s) for Map Google Map widget.
  LatLng? mapGoogleMapsCenter;
  final mapGoogleMapsController = Completer<GoogleMapController>();
  // Model for Button.
  late Button5Model buttonModel1;
  // Model for Button.
  late Button5Model buttonModel2;
  // Model for Button.
  late Button5Model buttonModel3;

  @override
  void initState(BuildContext context) {
    statusBadgeModel = createModel(context, () => StatusBadge3Model());
    buttonModel1 = createModel(context, () => Button5Model());
    buttonModel2 = createModel(context, () => Button5Model());
    buttonModel3 = createModel(context, () => Button5Model());
  }

  @override
  void dispose() {
    statusBadgeModel.dispose();
    buttonModel1.dispose();
    buttonModel2.dispose();
    buttonModel3.dispose();
  }
}
