# Nested checkout repair punch list

Clara, September 5, 2026. Reviewed revision: `07cbf49f45376f34ae84dd3ad90b4dfad9dd29ce`.

The nested `DIDz-io` checkout has a Git metadata pointer targeting unavailable `.git/modules/DIDz-io`. Git inspection fails for that nested location. The canonical identity repository at `/home/js/DIDzMonolith/DIDz-io` is separate and accessible.

Before repair, preserve every file in the broken nested checkout, inspect its `.gitmodules` registration, and compare contents with the intended revision. Restore or reinitialize metadata only after that comparison and explicit approval for any replacement. Do not delete the directory or assume it is disposable merely because Git cannot open it. No nested content was changed during this review.
