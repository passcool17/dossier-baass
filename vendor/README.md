# Bibliothèques vendues (pas de CDN)

Copies minifiées depuis `node_modules`, régénérées par `npm run vendor`.
Toutes les licences sont dans ce dossier. Aucun asset de
https://github.com/phaserjs/examples n’est recopié (référence MIT seulement).

| Fichier | Paquet | Licence |
| --- | --- | --- |
| phaser.min.js | phaser 3.90.0 | MIT, voir PHASER-LICENSE.md |
| rexflipplugin.min.js | phaser3-rex-plugins 1.80.20 (plugin Flip seulement) | MIT, voir REX-LICENSE.md |
| rextexttypingplugin.min.js | phaser3-rex-plugins 1.80.20 (plugin TextTyping seulement) | MIT, voir REX-LICENSE.md |
| gsap.min.js | gsap 3.15.1 | licence standard « no charge », voir GSAP-LICENSE.txt |
| howler.min.js | howler 2.2.4 | MIT, voir HOWLER-LICENSE.md |
| lottie_light.min.js | lottie-web 5.13.0 (lecteur light) | MIT, voir LOTTIE-LICENSE.md |

Le plugin UI complet de rex (`rexuiplugin.min.js`, ~219 Ko gzip) n’est **pas**
inclus : trop lourd pour le budget. Les panneaux d’événement sont dessinés
dans la scène Phaser, avec TextTyping pour le texte animé.
