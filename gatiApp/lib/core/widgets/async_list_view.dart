import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../theme/app_dimens.dart';
import 'state_views.dart';

/// Loading, error and pull-to-refresh for every data screen. Each feature
/// page only says how to turn its data into a list of widgets.
class AsyncListView<T> extends StatelessWidget {
  const AsyncListView({
    super.key,
    required this.value,
    required this.onRefresh,
    required this.builder,
  });

  final AsyncValue<T> value;
  final Future<void> Function() onRefresh;
  final List<Widget> Function(BuildContext context, T data) builder;

  @override
  Widget build(BuildContext context) => value.when(
    loading: () =>
        const Center(child: CircularProgressIndicator(strokeWidth: 2.5)),
    error: (error, _) => ErrorView(error: error, onRetry: onRefresh),
    data: (data) {
      final children = builder(context, data);
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: Gap.page,
          itemCount: children.length,
          separatorBuilder: (_, _) => const SizedBox(height: Gap.lg),
          itemBuilder: (_, i) => children[i],
        ),
      );
    },
  );
}
