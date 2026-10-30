// ------------------------------------------------------------------ site plan (one source for the map and the builders)
// Plan coordinates in metres at full size (the film miniature is 1:24): +x east, +z south (toward the Black Lake),
// y up, castle floor y = 0, loch surface y = -60. The layout follows the castle of the later films (Half-Blood Prince
// to Deathly Hallows). Sources per entry (`src`):
//   M = photos of the Leavesden miniature in its final state (ref/model, Wikimedia Commons, CC)
//   L = LEGO 76419 Hogwarts Castle and Grounds (2023), built mainly to Half-Blood Prince, and its Brickset review
//   F = the films as remembered plus fan wikis (Harry Potter Wiki, HP Lexicon); several of these move between films
// `sure: false` marks names or positions that are inferred. status: 'built' | 'mass' (blocks only) | 'todo'.
const LAKE_Y = -60;
const SRC_ZH = { M: '模型照片', L: '乐高76419', F: '影片/粉丝资料', S: '片场照片', P: '实景照片' };
// the south shore of the loch, the railway along it and Hogsmeade Station (opposite the castle, about 1.3 km away)
const STN = { z: 1322, y: LAKE_Y + 7.5, x0: -110, x1: 110 };
const GAUGE = 1.435;
function southZ(x) { return 1268 + 16 * noise3(x / 240, 2.2, 0.4); }
// Quidditch pitch (Half-Blood Prince on): down by the loch past Hagrid's hut. Ellipse: centre, half-axes, long-axis angle.
const PITCH = { cx: -600, cz: 166, a: 80, b: 34, rot: -29 * Math.PI / 180, y: null };
// the path from the far end of the wooden bridge, past the stone circle and the Whomping Willow, to Hagrid's hut and the pitch
const PATH_PTS = [[-326, -28], [-350, -31], [-372, -30], [-388, -10], [-398, 14], [-418, 34], [-440, 52], [-458, 72], [-480, 92], [-500, 104], [-516, 112]];
// the path from the suspension bridge's far gate up into the northern hills
const BRIDGE_PATH = [[-20, -110], [-21, -124], [-28, -146], [-44, -172], [-66, -198], [-92, -222]];
// the stream ravine north of the castle, from the hills in the north-east down to the west gorge
const RAVINE = [[70, -250], [55, -160], [30, -112], [0, -88], [-40, -82], [-90, -84], [-140, -88], [-185, -90], [-215, -92], [-238, -93]];
// the ruins' local frame (m45, m50): origin by the octagonal tower, u along the wall line toward the big square tower,
// v out over the brink, away from the castle
const RUIN_F = { o: [305, -222.7], u: [-0.86, -0.51], v: [0.51, -0.86] };
// the Training Grounds: the open ground between the castle's north side and the ruins, walled on the east by the curtain
// from the north gate (m42, m45); FIELD_TOE is the foot of the rocky hill that closes it on the west (m45, projected
// onto the ground through the miniature photo's solved camera), from south to north
const FIELD_TOE = [[150, -58], [172, -120], [200, -188], [252, -246]];
const FIELD_WALL = [[228, -4.5], [318, -202]];   // the curtain's line, the gate to the arcade at the east end of the ruins
// inside the Training Grounds (the castle's north side, the curtain, the ruins, the hill's foot): bare ground, as on the
// miniature, so no bushes are sown there
function inField(x, z) {
  const P = [[150, -36], ...FIELD_WALL, ...FIELD_TOE.slice().reverse()];
  let k = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, zi] = P[i], [xj, zj] = P[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) k = !k;
  }
  return k;
}
const ruinAt = (a, b) => [RUIN_F.o[0] + RUIN_F.u[0] * a + RUIN_F.v[0] * b, RUIN_F.o[1] + RUIN_F.u[1] * a + RUIN_F.v[1] * b];
const SITE = [
  // ---- batch 1: the lake front (the view from the boats)
  { id: 'hall', zh: '大礼堂', en: 'Great Hall', status: 'built', sure: true, src: 'ML', rect: [-128, 22, -72, 42],
    note: '湖岸一侧的长厅，扶壁顶上一排小尖塔，屋面很陡，带老虎窗。' },
  { id: 'porch', zh: '礼堂大门与钟面山墙', en: 'Great Hall doors & clock', status: 'built', sure: true, src: 'ML', rect: [-72, 26, -58, 50],
    note: '礼堂东端的山墙，大门上方有钟面，门外就是入口庭院。' },
  { id: 'grand', zh: '大楼梯塔（主塔）', en: 'Grand Staircase Tower', status: 'built', sure: true, src: 'ML', circle: [-54, 13, 13.5],
    note: '最粗的圆塔，圆锥顶上有四圈老虎窗。它和另外三座小塔围成四方庭院的四个角。' },
  { id: 'head', zh: '校长塔楼（邓布利多办公室）', en: "Headmaster's turrets", status: 'built', sure: true, src: 'ML', circle: [-69, 7, 4],
    note: '从主塔锥顶西侧伸出的三座小尖塔。' },
  { id: 'terrace', zh: '入口庭院与哥特拱廊', en: 'Entrance Courtyard & arcade', status: 'built', sure: false, src: 'ML', rect: [-78, 44, -16, 60],
    note: '礼堂大门外的庭院，船屋石阶爬上来就到这里；南沿一排尖拱廊，下面是很高的挡土墙。' },
  { id: 'cturret', zh: '庭院西角小圆塔', en: 'Courtyard corner turret', status: 'built', sure: true, src: 'M', circle: [-76, 58, 4.2] },
  { id: 'gwtower', zh: '高架桥西端圆塔', en: 'Viaduct west tower', status: 'built', sure: true, src: 'M', circle: [-20, 30, 6.2],
    note: '带出挑的雉堞环和高圆锥顶。' },
  { id: 'bridge', zh: '高架桥（石拱桥）', en: 'Viaduct', status: 'built', sure: false, src: 'ML', rect: [-16, 44, 26, 51],
    note: '第四部起。在崖顶边上跨过城堡正面的峡沟，下层七个高拱，上层一排小拱廊；西头接入口庭院东端，东头接入口楼大门前的平台，从入口楼西角圆塔前面经过（模型照片 m66）。乐高 76419 把这座桥标作高架桥。' },
  { id: 'south', zh: '高架桥入口楼（湖岸正楼）', en: 'Viaduct Entrance', status: 'built', sure: true, src: 'ML', rect: [8, 14, 50, 38],
    note: '中间一个山墙凸间：都铎拱大门、门上三扇高窗、山尖一个四叶窗；两边各五开间，扶壁和小尖塔隔开，两层高的双联尖拱窗；两角是出挑雉堞的圆塔（模型照片 m66）。' },
  { id: 'swturret', zh: '入口楼西角圆塔', en: 'Viaduct Entrance west turret', status: 'built', sure: true, src: 'M', circle: [10, 37, 6.5] },
  { id: 'seturret', zh: '入口楼东角圆塔', en: 'Viaduct Entrance east turret', status: 'built', sure: false, src: 'ML', circle: [50, 38, 7],
    note: '立在崖边，塔基一直落到崖壁下面（模型照片 m66）。' },
  { id: 'vcourt', zh: '高架桥庭院', en: 'Viaduct Courtyard', status: 'built', sure: false, src: 'MF', rect: [-14, 8, 8, 44],
    note: '高架桥背后、西端圆塔和入口楼之间的庭院，北面一栋楼。原来这里被当成一直通到湖边的峡沟，对照模型照片改成桥后是城堡，峡沟只在桥下。' },
  { id: 'gwindow', zh: '入口楼东侧大窗楼', en: 'Great-window range east of the Entrance', status: 'built', sure: false, src: 'M', rect: [56, 10, 71, 38],
    note: '入口楼东角圆塔旁边一座朝湖的山墙，山墙上一扇很大的哥特窗（模型照片 m66、m02）。' },
  { id: 'seblock', zh: '入口楼东侧楼', en: 'East of the Viaduct Entrance', status: 'built', sure: false, src: 'M', rect: [70, 8, 98, 34] },
  { id: 'crown', zh: '天文塔', en: 'Astronomy Tower', status: 'built', sure: true, src: 'ML', rect: [44, -40, 56, -28],
    note: '第六部起，城堡最高的塔，在中央大塔正后方。方塔身南面挑出一座半圆形的塔（下面是长长的倒圆锥托座），顶上一圈尖拱开口是观星台，再上去是全城最高的尖顶；东侧还挂着一座细圆塔。' },
  { id: 'central', zh: '中央大塔（哥特大窗）', en: 'Central tower', status: 'built', sure: false, src: 'M', rect: [41, -15, 59, 3],
    note: '四面山墙，南面一扇大哥特窗，八角尖顶，角上四座小尖塔。' },
  { id: 'boathouse', zh: '船屋', en: 'Boathouse', status: 'built', sure: true, src: 'MLF', rect: [45, 94, 58, 114],
    note: '新生坐船过湖在这里上岸；第八部斯内普死在船屋里。' },
  { id: 'stairs', zh: '船屋石阶', en: 'Boathouse stairs', status: 'built', sure: true, src: 'ML',
    line: [[51, 92], [10, 92], [-16, 90], [-56, 82], [-30, 73], [-56, 67], [-21.5, 61.5]],
    note: '从船屋沿湖岸向西，过了高架桥下的峡沟口，在庭院前的岩壁上来回转折三段，最后一段向东爬到庭院东头、高架桥西端旁边（模型照片 m65、m66）。' },
  // ---- east: the Long Gallery and the greenhouses
  { id: 'nave', zh: '长廊楼（杜伦风格）', en: 'Long Gallery', status: 'built', sure: true, src: 'ML', rect: [59, -24, 172, -2],
    note: '两层半圆拱窗，照杜伦大教堂的中殿设计。' },
  { id: 'twins', zh: '双塔（杜伦式西立面）', en: 'Twin towers', status: 'built', sure: true, src: 'ML', rect: [173, -33, 187, 7],
    note: '两座方塔，墙面满是盲拱，四角小尖塔加高尖顶。第一、二部直接用杜伦大教堂实景拍。' },
  { id: 'greenhouses', zh: '温室群', en: 'Greenhouses', status: 'built', sure: true, src: 'ML', rect: [100, 6, 222, 38],
    note: '长条玻璃温室，一部分在长廊楼南面，一部分在双塔东面、北门楼里头；四周一道薄围墙，围墙上嵌一座穹顶温室（照模型照片 m42）。' },
  // ---- centre
  { id: 'quad', zh: '四方庭院（变形课庭院）', en: 'Quad', status: 'built', sure: false, src: 'LM', rect: [-40, -32, -2, 6],
    note: '大楼梯塔是西南角，另外三角各一座小圆塔；四面楼的底层是朝院子开的尖拱回廊，院里草坪、十字石径和一座小喷泉。' },
  { id: 'middle', zh: '中庭及周围楼群', en: 'Middle Courtyard & ranges', status: 'built', sure: false, src: 'M', rect: [-128, -42, -52, 22],
    note: '礼堂北面、四方庭院西面的一圈楼，北、东、南三面有回廊；位置和形状是按模型照片里的屋顶推的。' },
  { id: 'suspension', zh: '木吊桥', en: 'Suspension bridge', status: 'built', sure: false, src: 'LF', line: [[-20, -58], [-20, -104]],
    note: '从四方庭院北楼出发，过两座连在一起的守桥小圆塔，吊在溪谷上，通到对岸的石拱门和山坡；桥板下垂，两边是主缆和吊索。位置是推定的。' },
  { id: 'ravine', zh: '北侧溪谷', en: 'North ravine & stream', status: 'built', sure: false, src: 'LF', line: RAVINE,
    note: '城堡北面的一条溪谷，往西流进深谷；乐高 76419 里高架桥和木吊桥下面是同一条河，这里按"吊桥下有溪"处理。' },
  { id: 'hospital', zh: '医院翼', en: 'Hospital wing', status: 'built', sure: false, src: 'MLF', rect: [-156, -60, -128, -46],
    note: '在城堡西北，钟楼东边。长楼两侧一排跌级山墙的石砌老虎窗，西头一座圆塔，再由一座架在高尖拱上的廊桥连到钟楼（照模型照片 m49）。' },
  { id: 'gryffindor', zh: '格兰芬多塔', en: 'Gryffindor Tower', status: 'built', sure: false, src: 'F', circle: [-118, -38, 8.5],
    note: '高圆塔，出挑雉堞，高锥顶，旁边一座楼梯小塔。粉丝资料说它在木吊桥和医院翼连桥之间，位置是推定的。' },
  // ---- west: the Prisoner of Azkaban additions across the gorge, Hagrid's side of the grounds
  { id: 'clock', zh: '钟楼（钟摆钟面）', en: 'Clock Tower', status: 'built', sure: true, src: 'MLF', rect: [-198, -64, -174, -38],
    note: '第三部起。很高的楼，南北两头是跌级山墙；西面朝深谷伸出一个尖山墙，山墙上是大钟面，下面很高的尖拱开口里能看见摆锤。从石圈那边看过来正对钟面（第三部剧照和模型照片都是这样）。' },
  { id: 'clockcourt', zh: '钟楼庭院（鹰像喷泉）', en: 'Clock Tower Courtyard', status: 'built', sure: false, src: 'MF', rect: [-200, -38, -160, -6],
    note: '三面回廊，中间是四只石鹰的喷泉；西面临崖是一道镂空的拱廊屏墙，门洞通木廊桥，两边各一座小圆塔。' },
  { id: 'woodbridge', zh: '木廊桥', en: 'Wooden Bridge', status: 'built', sure: true, src: 'MF', line: [[-200, -22], [-263, -22], [-326, -28]],
    note: '第三部起。在中间转个小角，有顶的长廊架在倒 V 形的木桁架上，跨过深谷通到石圈；第八部被炸毁。' },
  { id: 'stones', zh: '石圈', en: 'Stone circle', status: 'built', sure: true, src: 'MF', circle: [-372, -30, 13],
    note: '木廊桥对面的山坡顶上，十几块粗凿的巨石，下宽上窄、顶部斜断，有的歪了，一块倒地，一块断成矮桩，石面长满地衣；从这里能望见下面的海格小屋。' },
  { id: 'ruins', zh: '废墟城墙与残塔', en: 'Ruined wall & towers', status: 'built', sure: true, src: 'M', rect: [226, -276, 332, -176],
    note: '在城堡东北、北门楼外的山坡上，立在一道岩石陡坎的边上，陡坎朝东北落下去：八角残塔、带两个圆拱的残墙、底层两个拱门朝外的方形残塔，墙顶参差断裂；墙后约 45 米的平地上立着三块石头（两块挨着、一块稍远），再过去就是城堡北面（照模型照片 m45、m50，用 m45 的相机反推落点）。原来放在西侧山坡石圈旁边，是放错了。' },
  { id: 'hagrid', zh: '海格小屋', en: "Hagrid's Hut", status: 'built', sure: false, src: 'FP', circle: [-450, 62, 6],
    note: '第三部起搬到石圈下面的山坡上、禁林边，往下就是湖。两个圆形毛石墙筒，石板瓦圆锥顶带细长铅尖饰；两筒之间石墩石板的门廊和高木板门，门前石阶；小铅条窗、石烟囱，墙边独轮车载着大南瓜，旁边围着南瓜地（参考按电影设计复刻的实物照片）。' },
  { id: 'willow', zh: '打人柳', en: 'Whomping Willow', status: 'built', sure: false, src: 'MFS', circle: [-405, 8, 9],
    note: '第三部的位置：石圈去海格小屋的路边。照片场的打人柳模型：四股拧在一起的树干，粗根盘在石包上，短粗枝干末端是截头，每个截头射出一束又长又直的鞭枝。' },
  { id: 'gorge', zh: '西侧深谷与溪流', en: 'West gorge & stream', status: 'built', sure: false, src: 'M', line: [[-242, -330], [-242, 96]],
    note: '城堡一侧是陡峭岩壁，对面是长草坡，谷底一条溪流流进湖里。' },
  { id: 'paths', zh: '石圈—海格小屋—球场小路', en: 'Paths down to the pitch', status: 'built', sure: false, src: 'F', line: PATH_PTS,
    note: '从木廊桥西头经过石圈和打人柳，下到海格小屋，再到魁地奇球场。' },
  { id: 'forest', zh: '禁林', en: 'Forbidden Forest', status: 'built', sure: false, src: 'F', rect: [-1050, -460, -480, 90],
    note: '海格小屋后面一大片针叶林，林边一排粗大的古树（板根、歪干、团团的树冠），从小屋往林子里有一条小路，林间贴着地面有雾。' },
  { id: 'quidditch', zh: '魁地奇球场', en: 'Quidditch pitch', status: 'built', sure: false, src: 'F',
    ellipse: [PITCH.cx, PITCH.cz, PITCH.a, PITCH.b, PITCH.rot],
    note: '按第六部起的位置：湖边，海格小屋再往下。看台塔下半截是木格构，上面观众箱外挂学院纹章布（斜条纹、四分格、人字纹、菱格），布做的尖顶和长三角旗；塔之间是挂布的阶梯看台，两头各三个金色球门圈。不同电影里位置不同：第一、二部在城堡近旁，第三部在群山中。' },
  // ---- across the loch
  { id: 'station', zh: '霍格莫德车站', en: 'Hogsmeade Station', status: 'built', sure: false, src: 'PF', rect: [-120, 1276, 112, 1328],
    note: '在黑湖南岸、正对城堡（约 1.3 公里）。照第一部取景的高斯兰车站做：双轨双站台、石砌站房和短木雨棚、红色铸铁拱形格构天桥（两头楼梯）、奶油色护墙板候车室、红砖小屋、煤气灯、长椅、尖桩栅栏、HOGSMEADE 站牌。' },
  { id: 'express', zh: '霍格沃茨特快', en: 'Hogwarts Express', status: 'built', sure: true, src: 'P', rect: [-56, 1319, 89, 1325],
    note: '照真车 5972 号（大西部铁路"庄园"级 4-6-0）：红色锥形锅炉、黑烟箱（铰链、号牌、车头牌）、铜安全阀罩、三对红色辐条动轮、铜名牌，煤水车堆煤、侧面金色徽章，六节栗红色客车，夜里车窗亮灯；烟囱冒着白汽。' },
  { id: 'jetty', zh: '码头与小船', en: 'Jetty & boats', status: 'built', sure: false, src: 'F', line: [[-130, 1282], [-130, 1222]],
    note: '车站北边一段石阶下到湖边，木码头伸进湖里，两边系着十条带灯笼的小船：新生就是从这里坐船过湖的。' },
  { id: 'railway', zh: '铁路', en: 'Railway', status: 'built', sure: false, src: 'F', line: [[-240, 1322], [640, 1322]],
    note: '沿南岸铺的铁路，车站一段是双线，东边过一座石拱跨线桥伸进山里。' },
  // ---- north and far
  { id: 'lawn', zh: '训练场（飞行课草坪）', en: 'Training Grounds (flying lessons)', status: 'built', sure: false, src: 'MF', rect: [154, -69, 225, -38],
    note: '第一部霍琦夫人上飞行课的地方（那场戏在阿尼克城堡外庭拍）。后几部用的模型上，它是北门楼里头、城堡北面和废墟之间的一大片野地，约 150×200 米：东边是从北门楼一路伸到废墟的城墙，北边是废墟城墙，墙里三块立石，西边一道岩石山坡升向溪谷，坡面中段露出大块圆岩（照模型照片 m42、m45；用双塔、穹顶温室、废墟和立石求出 m45 的相机，再把照片里的墙脚、坡脚投到地面上定的位置）。地上是不修剪的野草和露头的矮岩石。两排扫帚放在双塔北面、靠城堡的一头，几把一直在动。原来用一圈自己编的墙围成一块 71×31 米的修剪草坪，是错的。' },
  { id: 'gate', zh: '北门楼', en: 'North gatehouse', status: 'built', sure: true, src: 'M', rect: [222, -6, 234, 8],
    note: '在双塔东面、温室外头：尖拱门洞夹在两座八角塔之间（八角塔带倾斜塔脚、两层小窗和雉堞），门道楼内侧一座更高的方楼，北边一座方塔，城墙接在两边（照模型照片 m42）。' },
  { id: 'curtain', zh: '外围城墙与出城大路', en: 'Curtain wall & road out', status: 'built', sure: false, src: 'M', line: [[228, 38], [228, -4.5], [318, -202]],
    note: '城墙从温室围墙南端往北经过门楼，再朝北偏东一直伸到废墟东头的残廊，是训练场的东界（照模型照片 m42、m45）；前 180 米完整，带雉堞和走道，最后约 40 米塌成参差的残墙。大路出门往东，再拐向东北（去霍格莫德方向）。' },
  { id: 'owlery', zh: '猫头鹰棚屋（岩柱上）', en: 'Owlery', status: 'built', sure: false, src: 'MF', circle: [-300, -140, 24],
    note: '第四部起。木廊桥西北面一根陡峭的岩柱，顶部收成尖，立着一座细长的圆塔：顶上挑出一圈托座撑着的冠，冠上一圈猫头鹰进出的圆拱洞和雉堞，矮锥顶；旁边一座楼梯小塔从塔身中段挑出，升到冠顶以上，顶着更高的尖顶（照模型照片 m00）。岩柱上有一道凿进岩面的石阶。' },
];
const SITE_BY = Object.fromEntries(SITE.map((s) => [s.id, s]));
function siteCenter(s) {
  if (s.rect) return [(s.rect[0] + s.rect[2]) / 2, (s.rect[1] + s.rect[3]) / 2];
  if (s.circle) return [s.circle[0], s.circle[1]];
  if (s.ellipse) return [s.ellipse[0], s.ellipse[1]];
  const l = s.line; return [(l[0][0] + l[l.length - 1][0]) / 2, (l[0][1] + l[l.length - 1][1]) / 2];
}

// the castle's interiors: separate sets, entered from the map or the camera menu
const INTERIORS = [
  { id: 'hall', zh: '大礼堂', en: 'Great Hall', status: 'built', src: 'SF', site: 'hall', shot: 'hall',
    note: '照利维斯登片场：石板地、砂岩墙、深色橡木护墙板，两侧六开间高高的铅条菱格窗，壁柱上的石兽托着火盆；四张学院长桌摆着金盘金杯，尽头高台上的教师长桌和金色猫头鹰讲台，后墙一扇大窗；大门两边壁龛里立着石像。四百多支漂浮的蜡烛，天花板是施了魔法的天空（白天云，夜里星）。' },
  { id: 'stair', zh: '门厅与大楼梯', en: 'Entrance Hall & Grand Staircase', status: 'built', src: 'F', site: 'grand', shot: 'stair',
    note: '一口方形的高石井：每层四面回廊带石栏杆，楼梯一段段跨过中间的空井连接上下层（有一段正转到半路），墙上挂满金框肖像，墙上插着火把；顶上是木梁天花板和一个铁蜡烛吊灯，西墙顶层三扇高窗（朝四方庭院）斜照进阳光。底层是门厅：北面大门，南面通礼堂的门（半开着）。' },
  { id: 'office', zh: '校长办公室', en: "Headmaster's office", status: 'todo', site: 'head', note: '圆形，满墙书架和历任校长肖像，冥想盆、福克斯的栖架、旋转楼梯入口。' },
  { id: 'gryffcommon', zh: '格兰芬多公共休息室', en: 'Gryffindor common room', status: 'built', src: 'SF', site: 'gryffindor', shot: 'gryff',
    note: '塔里的八角形房间：砂灰色毛石墙挂满红底千花挂毯（白色小兽、蓝色花岛、贵妇、狮子和独角兽举着新月纹旗），挂毯上挂着金框油画；北墙大石壁炉，锥形石烟罩一直升到天花板，上面刻着格兰芬多院徽，壁炉左边是带小窗的炉边座位；三个带窗座的深窗洞；红丝绒扶手椅、高背翼椅、搭着学院毯子的沙发、脚凳、波斯地毯、黄铜油灯和镂空铜吊灯；东南角的圆拱门里是上宿舍的螺旋石梯，南面是画像洞（胖夫人画像的背面）和布告栏，窗边一盘下到一半的巫师棋。' },
  { id: 'gryffdorm', zh: '格兰芬多男生宿舍', en: 'Gryffindor dormitory', status: 'built', src: 'SF', site: 'gryffindor', shot: 'gdorm',
    note: '在休息室正上方，从休息室东南角的圆拱门顺着螺旋石梯转四圈上来，穿过一小段走廊进门。圆形塔室：石墙上一圈弯木梁，往上是木板墙和锥形木屋顶，两根粗糙的大梁交叉；中间一个带铁丝罩的铸铁炉，炉管通上屋顶；五张挂红丝绒帐子、里面是红底金星内帐的四柱床，床头的号牌，床尾刻着主人缩写的箱子（H.P、R.W……），罗恩床上是拼花毛毯；床边的柜子、镜柜、挂着校袍和学院围巾的衣钩；床与床之间是铅条细尖窗。' },
  { id: 'library', zh: '图书馆与禁书区', en: 'Library & Restricted Section', status: 'todo', site: 'middle' },
  { id: 'potions', zh: '魔药课教室（地下）', en: 'Potions classroom', status: 'todo', site: 'terrace' },
  { id: 'astrotop', zh: '天文塔顶', en: 'Astronomy Tower top', status: 'todo', site: 'crown', note: '第六部邓布利多遇害的地方：圆形塔顶、铁环形的大天球仪。' },
  { id: 'requirement', zh: '有求必应屋', en: 'Room of Requirement', status: 'todo', site: 'quad' },
  { id: 'ward', zh: '医院翼病房', en: 'Hospital wing ward', status: 'todo', site: 'hospital' },
  { id: 'dada', zh: '黑魔法防御术教室', en: 'Defence Against the Dark Arts classroom', status: 'todo', site: 'central' },
  { id: 'transfig', zh: '变形课教室', en: 'Transfiguration classroom', status: 'todo', site: 'quad' },
  { id: 'chamber', zh: '密室', en: 'Chamber of Secrets', status: 'todo', site: 'greenhouses', note: '乐高 76419 把它放在温室下面。' },
  { id: 'slytherin', zh: '斯莱特林公共休息室（湖底）', en: 'Slytherin common room', status: 'todo', site: 'terrace' },
  { id: 'trophy', zh: '奖品陈列室', en: 'Trophy room', status: 'todo', site: 'middle' },
];
