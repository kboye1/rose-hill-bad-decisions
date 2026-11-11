# Edwards Parade: exterior research and implementation

Checked November 10, 2026, before the version 17 rebuild. This brief separates observations from game approximations. The goal is a recognizable central quadrangle and courtyard, not a measured architectural survey.

## Area and orientation

[Fordham’s illustrated campus map](https://www.fordham.edu/media/home/admin-use-only/Rose-Hill-Campus-Map.png) places Keating at the eastern end of Edwards Parade, Freeman along its southern edge, and Hughes, Dealy and Cunniffe House around the western courtyard. The ram and Carolyn Dursi Cunniffe Fountain are separate landmarks in that courtyard. The long lawn is approached by perimeter walks; an invented diagonal paved crossing through the grass would misrepresent this plan.

The game now retains those **five main buildings**, Keating’s tower and Dealy’s attached cafe. McShane, the gym, athletics facilities, dormitories and the distant library are outside this version’s playable crop. Duane is southwest of the quad in the map, not an oversized block filling the space between Hughes and Dealy; it remains outside this crop. Their earlier model functions are retained in the source for possible future expansion, but they are not rendered.

The current game boundary is approximately 180 by 140 game meters, about **87% less playable ground** than the previous broad-campus boundary. It is an intentionally compressed selection. The central lawn and the landmark models retain their existing scale; reducing the map means removing long peripheral journeys, rather than shrinking all the buildings into miniatures.

## Building observations

| Landmark | Evidence and observed details | Version 17 response |
| --- | --- | --- |
| Keating | [Renovation architect KB](https://kblarchitects.com/Fordham-Keating-Hall) identifies the Collegiate Gothic centerpiece. [Fordham’s Terrace of the Presidents account](https://now.fordham.edu/commencement/commencement-2023/the-terrace-of-the-presidents/) specifies 19 named steps. Previous photo research established the tall central tower, lower wings and projecting entrance. | Keep the dedicated tower, facade, banner and raised terrace. Change the flight to 19 treads and add three selected name inscriptions. Their positions are illustrative, not a transcription of every carving. |
| Hughes | [HLW’s completed exterior photographs](https://www.hlw.com/project/fordham-university-gabelli-school-of-business/) show rough gray masonry, pale quoins, different window tiers, a green glass mansard roof and a transparent entrance canopy. [Fordham’s renovation article](https://now.fordham.edu/university-news/architecture-brings-digital-age-to-hughes-hall-video-2/) identifies the wide marble entrance steps. | Retain the dedicated version 16 facade, walkable steps, glazing and ribbed roof. Remove the old ram from the wrong corner and position the rebuilt sculpture in the courtyard on the map’s side of Hughes. |
| Dealy | [KB’s renovation page](https://kblarchitects.com/Fordham-Dealy-Hall) describes separate office and classroom wings. [Ground-level side photograph](https://commons.wikimedia.org/wiki/File:Dealy_Hall_side.jpg) shows five distinct window tiers, pale corner blocks, flat roof and a light rectangular-window top band. | Retain the dedicated five-tier facade and roof equipment. Keep the attached cafe terrace. The simplified rectangular main footprint does not reproduce every wing. |
| Cunniffe House | [Fordham’s dedication account](https://now.fordham.edu/university-news/administration-building-named-for-alumni/) identifies the historic manor. [Raymond Bucko’s 2014 side photograph](https://commons.wikimedia.org/wiki/File:Fordham_University_Cunniffe_House.jpg) shows a red-brick, two-level courtyard wing with arched lower windows, rectangular upper windows, pale lintels, cornice and clipped planting. [Municipal Art Society’s historic record](https://urbanarchive.org/o/masnyc/post/bfa0787d-3146-4b8a-828e-a6600cb0edaf) places the Greek Revival porch on the west facade. | Replace the generic Gothic treatment with a low brick wing, distinct window levels and pale cornice. Put a simplified columned porch on the west rather than copying it onto the courtyard face. Hidden elevations and central volume remain approximate. |
| Freeman | [2017 exterior photograph](https://commons.wikimedia.org/wiki/File:Freeman_Hall,_Fordham.jpg), cross-checked with the [Fordham photo archive record](https://www.library.fordham.edu/digital/collection/market/id/41), shows a substantial gray-stone building with rectangular windows, a projecting central entrance bay, pointed doorway, parapet and raised balustraded terrace. | Replace the short generic hall with a taller dedicated facade, projecting entrance, flat parapet and walkable approach. Window count, terrace dimensions and side elevations are approximations. |

The current cafe and patio presence is supported by [Fordham Dining’s destination guide](https://fordham.campusdish.com/-/media/Local/Higher-Education/GroupC/Fordham/Files/Destination-Dining.ashx). The glazed cafe extension and table arrangement remain simplified; there is no claim that its dimensions have been measured.

## Ram statue

The [university’s Hughes page](https://www.fordham.edu/gabelli-school-of-business/academic-programs-and-admissions/undergraduate-programs/which-campus/hughes-hall/) explicitly identifies the ram outside Hughes. [Fordham’s sculpture biography](https://www.fordham.edu/about/campuses/lincoln-center-campus/fordhams-sculpture-walk/featured-artists/harry-m-stierwalt-jr/) identifies Harry M. Stierwalt Jr. as the sculptor of the rams on both campuses; the date, dimensions and plaza description on that page concern the Lincoln Center installation and are **not** used as Rose Hill measurements.

[Raymond Bucko’s Rose Hill ram photograph](https://commons.wikimedia.org/wiki/File:Fordham_University_Ram_statue.png) was inspected for its long woolly body, upright neck, extended muzzle and large spiraling horns. HLW’s Hughes overview supplies additional context for the irregular rock and rectangular plinth. The new original procedural model adds those features, a bronze surface, bent hind legs, ears, eyes and a small identifying plaque. It is a recognizable simplified sculpture, not a scan or an exact copy of its fine surface carving.

The sculpture sits east of the fountain on the Hughes courtyard side, following the map’s relative placement. Its plinth has collision; the player can read a short landmark card nearby. **B → The Fordham Ram → Find on map** guides the player to it.

## Fountain and courtyard

[Fordham’s 2013 dedication account](https://now.fordham.edu/university-news/administration-building-named-for-alumni/) places Carolyn Dursi Cunniffe Fountain between Hughes and Dealy, facing the historic manor. [Bucko’s March 2014 courtyard photograph](https://commons.wikimedia.org/wiki/File:Fordham_Dealy_Hall_and_fountain.jpg) shows a patterned paved court, dark tiered bowls on an ornamental stem, a circular planted base, clipped hedges, benches and mature trees. This corrected the earlier game’s exposed ground-level pool.

The new model uses two bronze-colored bowls, rim details, a tall stem and finial, a circular hedge-and-flower surround, pale patterned paving, benches and nearby tables. Fine figurative relief on the original stem is not reconstructed. Water lines are decorative approximations. Planting and furniture counts are not a current inventory; the contextual photograph is from 2014.

[Fordham’s tree-care article](https://now.fordham.edu/university-news/at-rose-hill-university-works-to-save-280-year-old-tree/) reinforces the importance of mature elms around Cunniffe. The game retains broad branching trees and adds a landscaped screen along the playable crop. That screen marks the game boundary; it is not a claim of an actual continuous planted row.

## What remains approximate

The official map is an illustrated plan, and the photos span different dates and viewpoints. We do not have a survey, current elevations for every side, measured window spacing, an exact paving plan or a complete inventory of benches, signs and plantings. Building masses, courtyard relationships and identifying features take priority. Ground dimensions, repeated bays, minor ornaments, hidden walls and boundary landscaping remain stylized.

All distributed geometry, textures, lettering and sculpture meshes are original procedural work. The reference photographs remain at their source sites and are not bundled as game assets. The unrelated loading illustration is original AI-generated artwork, documented separately in `assets/ARTWORK.md`.

## Keeping the game playable

The smaller map keeps all three stories and quick jobs. Fictional encounter locations are now inside the crop: Jules on Freeman Walk, the missing shoe on the statue walk, the slide USB at the Starbucks terrace, Sam near Hughes, and Dev beside Dealy. The quiet drop-off is in Cunniffe court. The escape-job flyer is on Keating’s steps. These are staged game locations, not claims about real shuttle operations or student events. The minimap is zoomed to the new playable area, and landmark tracking is available alongside story tracking.
