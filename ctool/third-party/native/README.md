# Native dependency notices

Ctool source uses MIT; native dependencies keep their own terms. canvas is MIT, sharp is Apache-2.0, sharp-libvips is LGPL-3.0-or-later with its bundled components listed in the package notice and sharp-versions.json. These dynamic libraries are unmodified; replacement and debugging of modifications under their licenses are permitted.

The assembled package licenses/native/binary-inventory.json identifies the files shipped in this Linux x64 build. Common license texts and upstream copyright notices preserved by the local distribution are included. Distribution copyright documents are supplemental references, not proof that the bundled binary has the distribution's version. Canvas does not publish a machine-readable version inventory for all bundled .so files; no such versions are inferred here.

Corresponding source and build recipes:
- canvas 3.2.3: https://github.com/Automattic/node-canvas/tree/v3.2.3
- canvas prebuild artifact: https://github.com/Automattic/node-canvas/releases/tag/v3.2.3
- sharp 0.35.5: https://github.com/lovell/sharp/tree/v0.35.5
- sharp-libvips 1.3.4: https://github.com/lovell/sharp-libvips/tree/v1.3.4 (build scripts select component sources; compare the generated licenses/native/sharp-versions.json)

Before public redistribution, resolve the missing upstream standalone MIT notices documented for @canvas/image-data, decode-bmp, decode-ico and to-data-view, and archive exact corresponding native dependency sources/build recipes alongside immutable release artifacts. This local build is not a legal certification or a completed public release.
