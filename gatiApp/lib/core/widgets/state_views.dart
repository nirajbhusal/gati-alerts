import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../error/failure.dart';
import '../l10n/app_strings.dart';
import '../theme/app_dimens.dart';

/// Quiet centred icon + message, with an optional action.
class MessageView extends StatelessWidget {
  const MessageView({
    super.key,
    required this.icon,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Gap.xl,
          vertical: Gap.xl * 2,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 32, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: Gap.md),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (action != null) ...[const SizedBox(height: Gap.lg), action!],
          ],
        ),
      ),
    );
  }
}

class ErrorView extends ConsumerWidget {
  const ErrorView({super.key, required this.error, this.onRetry});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final failure = Failure.from(error);
    return MessageView(
      icon: failure is NetworkFailure
          ? Icons.cloud_off_outlined
          : Icons.error_outline,
      message: switch (failure) {
        NetworkFailure() => s.errorNetwork,
        ServerFailure() => s.errorServer,
        ParseFailure() => s.errorParse,
      },
      action: onRetry == null
          ? null
          : OutlinedButton(
              style: OutlinedButton.styleFrom(minimumSize: const Size(140, 44)),
              onPressed: onRetry,
              child: Text(s.retry),
            ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, required this.message, this.icon});

  final String message;
  final IconData? icon;

  @override
  Widget build(BuildContext context) =>
      MessageView(icon: icon ?? Icons.inbox_outlined, message: message);
}
