# Native dependency notices

Ctool source uses MIT; native dependencies keep their own terms. canvas is MIT, sharp is Apache-2.0, sharp-libvips is LGPL-3.0-or-later with its bundled components listed in the package notice and sharp-versions.json. These dynamic libraries are unmodified; replacement and debugging of modifications under their licenses are permitted.

The assembled package licenses/native/binary-inventory.json identifies the files shipped in this Linux x64 build. Common license texts and upstream copyright notices preserved by the local distribution are included. Distribution copyright documents are supplemental references, not proof that the bundled binary has the distribution's version. Canvas does not publish a machine-readable version inventory for all bundled .so files; no such versions are inferred here.

Corresponding source and build recipes:
- canvas 3.2.3: https://github.com/Automattic/node-canvas/tree/v3.2.3
- canvas prebuild artifact: https://github.com/Automattic/node-canvas/releases/tag/v3.2.3
- sharp 0.35.5: https://github.com/lovell/sharp/tree/v0.35.5
- sharp-libvips 1.3.4: https://github.com/lovell/sharp-libvips/tree/v1.3.4 (build scripts select component sources; compare the generated licenses/native/sharp-versions.json)

For each public release, provide exact corresponding sources, patches, build recipes and notices alongside immutable binary artifacts. Ctool 0.3.0 supplies these as twelve source-archive parts with per-part and combined SHA-256, original download manifests and rebuild directions in its GitHub Release. The publication record at ../../doc/verification/release-0.3.0/README.md identifies the archived sources, all 26 byte-identical upstream canvas binaries and the Debian libstdc++ Build ID match.

The published @canvas/image-data, decode-bmp, decode-ico and to-data-view packages declare MIT but contain no standalone copyright/license file. Their exact npm source tarballs and published metadata are archived, integrity-checked, and provided with their original README and existing MIT permission notices; no copyright holder or year is invented. These provenance records are not legal certification or a claim of bit-for-bit rebuild reproducibility. Historical preparation notes inside the immutable 0.3.0 ZIP are supplemented by the release source archive and publication record.

Ctool 0.3.1 retains all 28 native binary inventory records byte-for-byte from 0.3.0. Its release references the immutable 0.3.0 corresponding-source archive and checksums; no native dependencies or build recipes changed.
