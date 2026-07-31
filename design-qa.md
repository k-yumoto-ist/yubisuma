# Design QA — simple hand redesign

## Comparison input

- Source: `C:\Users\KAZUNORI\.codex\codex-remote-attachments\019fb7e4-417f-7332-bb92-7f0f020998d2\655F6521-0C84-4E56-84C8-4F359F84173A\1-写真1.jpg` (554 × 403)
- Rendered state: `artifacts/simple-hand-redesign/iteration1/03-both.png` (390 × 844, both player thumbs raised)
- Combined comparison: `artifacts/simple-hand-redesign/iteration1/05-reference-comparison.png`
- Additional states: `00-zero.png`, `01-left.png`, `02-right.png`, `03-both.png`

## Fidelity review

| Surface | Review |
| --- | --- |
| Silhouette | The hand now reads as a horizontal forearm ending in a rounded fist, with the thumb rising above it. Wrists remain outside and fists face the center, matching the reference's core pose. |
| Thumb clarity | The raised thumb is a single large shape with a high vertical profile. The folded state stays visibly tucked over the fist instead of becoming a number badge or abstract marker. |
| Left/right relationship | The same original vector is mirrored so the pair faces inward symmetrically, like the reference. The left and right controls remain individually selectable. |
| Styling | Thick dark outlines, warm skin fill, one restrained highlight, and only four fold lines keep the image legible at compact CPU size and large player size. |
| Game states | Zero, left, right, and both-raised states remain immediately distinguishable; selected thumbs lift and glow without changing the underlying silhouette. Used/unavailable states keep the hand visible and add a bandage/cross treatment. |

## Iteration notes

- Removed the prior upright palm/finger construction, which read as an open hand rather than a fist.
- Changed the SVG from a tall `160 × 180` composition to a horizontal `180 × 150` composition.
- Integrated the forearm into the fist silhouette and mirrored hands by physical side, not player ownership.
- Enlarged the thumb and increased outline weight to retain clarity on mobile.
- Replaced the duel board's `overflow: hidden` with `overflow: clip`; this prevents focus on the outer thumb from programmatically shifting the fixed board sideways on wider iPhone viewports.
- Compared the reference and rendered 390 × 844 state in the same image. No P1/P2 mismatch remains for the requested simplified pose; remaining differences are intentional original-art simplifications rather than copied anatomy.

Final viewport checks at 320 × 568, 375 × 667, 390 × 844, and 430 × 932 all reported document dimensions equal to viewport dimensions, page/grid scroll offsets of zero, and no console or page errors.

## Final result

passed
