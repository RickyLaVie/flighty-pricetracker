export interface Airport {
  iata: string;
  name: string;
  nameZh: string;
  city: string;
  cityZh: string;
  country: string;
  countryZh: string;
}

export const AIRPORTS: Airport[] = [
  // Taiwan
  { iata: "TPE", name: "Taoyuan International", nameZh: "桃園國際機場", city: "Taipei", cityZh: "台北", country: "Taiwan", countryZh: "台灣" },
  { iata: "TSA", name: "Songshan Airport", nameZh: "松山機場", city: "Taipei", cityZh: "台北", country: "Taiwan", countryZh: "台灣" },
  { iata: "KHH", name: "Kaohsiung International", nameZh: "小港國際機場", city: "Kaohsiung", cityZh: "高雄", country: "Taiwan", countryZh: "台灣" },
  { iata: "RMQ", name: "Taichung International", nameZh: "台中國際機場", city: "Taichung", cityZh: "台中", country: "Taiwan", countryZh: "台灣" },
  { iata: "TNN", name: "Tainan Airport", nameZh: "台南機場", city: "Tainan", cityZh: "台南", country: "Taiwan", countryZh: "台灣" },
  // Japan
  { iata: "NRT", name: "Narita International", nameZh: "成田國際機場", city: "Tokyo", cityZh: "東京", country: "Japan", countryZh: "日本" },
  { iata: "HND", name: "Haneda Airport", nameZh: "羽田機場", city: "Tokyo", cityZh: "東京", country: "Japan", countryZh: "日本" },
  { iata: "KIX", name: "Kansai International", nameZh: "關西國際機場", city: "Osaka", cityZh: "大阪", country: "Japan", countryZh: "日本" },
  { iata: "ITM", name: "Itami Airport", nameZh: "大阪伊丹機場", city: "Osaka", cityZh: "大阪", country: "Japan", countryZh: "日本" },
  { iata: "CTS", name: "New Chitose Airport", nameZh: "新千歲機場", city: "Sapporo", cityZh: "札幌", country: "Japan", countryZh: "日本" },
  { iata: "FUK", name: "Fukuoka Airport", nameZh: "福岡機場", city: "Fukuoka", cityZh: "福岡", country: "Japan", countryZh: "日本" },
  { iata: "OKA", name: "Naha Airport", nameZh: "那霸機場", city: "Okinawa", cityZh: "沖繩", country: "Japan", countryZh: "日本" },
  { iata: "NGO", name: "Chubu Centrair", nameZh: "中部國際機場", city: "Nagoya", cityZh: "名古屋", country: "Japan", countryZh: "日本" },
  { iata: "HIJ", name: "Hiroshima Airport", nameZh: "廣島機場", city: "Hiroshima", cityZh: "廣島", country: "Japan", countryZh: "日本" },
  { iata: "SDJ", name: "Sendai Airport", nameZh: "仙台機場", city: "Sendai", cityZh: "仙台", country: "Japan", countryZh: "日本" },
  { iata: "OKJ", name: "Okayama Airport", nameZh: "岡山機場", city: "Okayama", cityZh: "岡山", country: "Japan", countryZh: "日本" },
  // Korea
  { iata: "ICN", name: "Incheon International", nameZh: "仁川國際機場", city: "Seoul", cityZh: "首爾", country: "South Korea", countryZh: "韓國" },
  { iata: "GMP", name: "Gimpo Airport", nameZh: "金浦機場", city: "Seoul", cityZh: "首爾", country: "South Korea", countryZh: "韓國" },
  { iata: "PUS", name: "Gimhae International", nameZh: "金海國際機場", city: "Busan", cityZh: "釜山", country: "South Korea", countryZh: "韓國" },
  { iata: "CJU", name: "Jeju International", nameZh: "濟州國際機場", city: "Jeju", cityZh: "濟州", country: "South Korea", countryZh: "韓國" },
  // Hong Kong / Macau
  { iata: "HKG", name: "Hong Kong International", nameZh: "香港國際機場", city: "Hong Kong", cityZh: "香港", country: "Hong Kong", countryZh: "香港" },
  { iata: "MFM", name: "Macau International", nameZh: "澳門國際機場", city: "Macau", cityZh: "澳門", country: "Macau", countryZh: "澳門" },
  // China
  { iata: "PEK", name: "Capital International", nameZh: "首都國際機場", city: "Beijing", cityZh: "北京", country: "China", countryZh: "中國" },
  { iata: "PKX", name: "Daxing International", nameZh: "大興國際機場", city: "Beijing", cityZh: "北京", country: "China", countryZh: "中國" },
  { iata: "PVG", name: "Pudong International", nameZh: "浦東國際機場", city: "Shanghai", cityZh: "上海", country: "China", countryZh: "中國" },
  { iata: "SHA", name: "Hongqiao Airport", nameZh: "虹橋機場", city: "Shanghai", cityZh: "上海", country: "China", countryZh: "中國" },
  { iata: "CAN", name: "Baiyun International", nameZh: "白雲國際機場", city: "Guangzhou", cityZh: "廣州", country: "China", countryZh: "中國" },
  { iata: "SZX", name: "Bao'an International", nameZh: "寶安國際機場", city: "Shenzhen", cityZh: "深圳", country: "China", countryZh: "中國" },
  { iata: "CTU", name: "Tianfu International", nameZh: "天府國際機場", city: "Chengdu", cityZh: "成都", country: "China", countryZh: "中國" },
  { iata: "KMG", name: "Changshui International", nameZh: "長水國際機場", city: "Kunming", cityZh: "昆明", country: "China", countryZh: "中國" },
  { iata: "XMN", name: "Gaoqi International", nameZh: "高崎國際機場", city: "Xiamen", cityZh: "廈門", country: "China", countryZh: "中國" },
  { iata: "HGH", name: "Xiaoshan International", nameZh: "蕭山國際機場", city: "Hangzhou", cityZh: "杭州", country: "China", countryZh: "中國" },
  // Southeast Asia
  { iata: "BKK", name: "Suvarnabhumi Airport", nameZh: "蘇萬那普機場", city: "Bangkok", cityZh: "曼谷", country: "Thailand", countryZh: "泰國" },
  { iata: "DMK", name: "Don Mueang Airport", nameZh: "廊曼機場", city: "Bangkok", cityZh: "曼谷", country: "Thailand", countryZh: "泰國" },
  { iata: "HKT", name: "Phuket International", nameZh: "普吉島機場", city: "Phuket", cityZh: "普吉島", country: "Thailand", countryZh: "泰國" },
  { iata: "CNX", name: "Chiang Mai International", nameZh: "清邁機場", city: "Chiang Mai", cityZh: "清邁", country: "Thailand", countryZh: "泰國" },
  { iata: "SIN", name: "Changi Airport", nameZh: "樟宜機場", city: "Singapore", cityZh: "新加坡", country: "Singapore", countryZh: "新加坡" },
  { iata: "KUL", name: "Kuala Lumpur International", nameZh: "吉隆坡國際機場", city: "Kuala Lumpur", cityZh: "吉隆坡", country: "Malaysia", countryZh: "馬來西亞" },
  { iata: "MNL", name: "Ninoy Aquino International", nameZh: "馬尼拉機場", city: "Manila", cityZh: "馬尼拉", country: "Philippines", countryZh: "菲律賓" },
  { iata: "CEB", name: "Mactan-Cebu International", nameZh: "宿霧機場", city: "Cebu", cityZh: "宿霧", country: "Philippines", countryZh: "菲律賓" },
  { iata: "CGK", name: "Soekarno-Hatta International", nameZh: "蘇加諾—哈達機場", city: "Jakarta", cityZh: "雅加達", country: "Indonesia", countryZh: "印尼" },
  { iata: "DPS", name: "Ngurah Rai International", nameZh: "努沙杜瓦機場", city: "Bali", cityZh: "峇里島", country: "Indonesia", countryZh: "印尼" },
  { iata: "HAN", name: "Noi Bai International", nameZh: "內排國際機場", city: "Hanoi", cityZh: "河內", country: "Vietnam", countryZh: "越南" },
  { iata: "SGN", name: "Tan Son Nhat International", nameZh: "新山一機場", city: "Ho Chi Minh City", cityZh: "胡志明市", country: "Vietnam", countryZh: "越南" },
  { iata: "DAD", name: "Da Nang International", nameZh: "峴港機場", city: "Da Nang", cityZh: "峴港", country: "Vietnam", countryZh: "越南" },
  { iata: "RGN", name: "Yangon International", nameZh: "仰光國際機場", city: "Yangon", cityZh: "仰光", country: "Myanmar", countryZh: "緬甸" },
  { iata: "PNH", name: "Phnom Penh International", nameZh: "金邊機場", city: "Phnom Penh", cityZh: "金邊", country: "Cambodia", countryZh: "柬埔寨" },
  { iata: "REP", name: "Siem Reap International", nameZh: "暹粒機場", city: "Siem Reap", cityZh: "暹粒", country: "Cambodia", countryZh: "柬埔寨" },
  // South Asia
  { iata: "DEL", name: "Indira Gandhi International", nameZh: "英迪拉甘地機場", city: "New Delhi", cityZh: "新德里", country: "India", countryZh: "印度" },
  { iata: "BOM", name: "Chhatrapati Shivaji International", nameZh: "孟買機場", city: "Mumbai", cityZh: "孟買", country: "India", countryZh: "印度" },
  { iata: "CMB", name: "Bandaranaike International", nameZh: "科倫坡機場", city: "Colombo", cityZh: "科倫坡", country: "Sri Lanka", countryZh: "斯里蘭卡" },
  // Middle East
  { iata: "DXB", name: "Dubai International", nameZh: "杜拜國際機場", city: "Dubai", cityZh: "杜拜", country: "UAE", countryZh: "阿聯酋" },
  { iata: "AUH", name: "Abu Dhabi International", nameZh: "阿布達比機場", city: "Abu Dhabi", cityZh: "阿布達比", country: "UAE", countryZh: "阿聯酋" },
  { iata: "DOH", name: "Hamad International", nameZh: "哈馬德國際機場", city: "Doha", cityZh: "多哈", country: "Qatar", countryZh: "卡達" },
  { iata: "IST", name: "Istanbul Airport", nameZh: "伊斯坦堡機場", city: "Istanbul", cityZh: "伊斯坦堡", country: "Turkey", countryZh: "土耳其" },
  // Europe
  { iata: "LHR", name: "Heathrow Airport", nameZh: "希斯洛機場", city: "London", cityZh: "倫敦", country: "UK", countryZh: "英國" },
  { iata: "LGW", name: "Gatwick Airport", nameZh: "蓋威克機場", city: "London", cityZh: "倫敦", country: "UK", countryZh: "英國" },
  { iata: "CDG", name: "Charles de Gaulle Airport", nameZh: "戴高樂機場", city: "Paris", cityZh: "巴黎", country: "France", countryZh: "法國" },
  { iata: "AMS", name: "Schiphol Airport", nameZh: "史基浦機場", city: "Amsterdam", cityZh: "阿姆斯特丹", country: "Netherlands", countryZh: "荷蘭" },
  { iata: "FRA", name: "Frankfurt Airport", nameZh: "法蘭克福機場", city: "Frankfurt", cityZh: "法蘭克福", country: "Germany", countryZh: "德國" },
  { iata: "MUC", name: "Munich Airport", nameZh: "慕尼黑機場", city: "Munich", cityZh: "慕尼黑", country: "Germany", countryZh: "德國" },
  { iata: "ZRH", name: "Zurich Airport", nameZh: "蘇黎世機場", city: "Zurich", cityZh: "蘇黎世", country: "Switzerland", countryZh: "瑞士" },
  { iata: "VIE", name: "Vienna International", nameZh: "維也納機場", city: "Vienna", cityZh: "維也納", country: "Austria", countryZh: "奧地利" },
  { iata: "FCO", name: "Fiumicino Airport", nameZh: "菲烏米奇諾機場", city: "Rome", cityZh: "羅馬", country: "Italy", countryZh: "義大利" },
  { iata: "MAD", name: "Barajas Airport", nameZh: "馬德里機場", city: "Madrid", cityZh: "馬德里", country: "Spain", countryZh: "西班牙" },
  { iata: "BCN", name: "El Prat Airport", nameZh: "巴塞隆納機場", city: "Barcelona", cityZh: "巴塞隆納", country: "Spain", countryZh: "西班牙" },
  { iata: "PRG", name: "Václav Havel Airport", nameZh: "布拉格機場", city: "Prague", cityZh: "布拉格", country: "Czech Republic", countryZh: "捷克" },
  { iata: "CPH", name: "Copenhagen Airport", nameZh: "哥本哈根機場", city: "Copenhagen", cityZh: "哥本哈根", country: "Denmark", countryZh: "丹麥" },
  { iata: "HEL", name: "Helsinki Airport", nameZh: "赫爾辛基機場", city: "Helsinki", cityZh: "赫爾辛基", country: "Finland", countryZh: "芬蘭" },
  // Americas
  { iata: "LAX", name: "Los Angeles International", nameZh: "洛杉磯國際機場", city: "Los Angeles", cityZh: "洛杉磯", country: "USA", countryZh: "美國" },
  { iata: "JFK", name: "John F. Kennedy International", nameZh: "甘迺迪國際機場", city: "New York", cityZh: "紐約", country: "USA", countryZh: "美國" },
  { iata: "EWR", name: "Newark Liberty International", nameZh: "紐瓦克機場", city: "New York", cityZh: "紐約", country: "USA", countryZh: "美國" },
  { iata: "SFO", name: "San Francisco International", nameZh: "舊金山國際機場", city: "San Francisco", cityZh: "舊金山", country: "USA", countryZh: "美國" },
  { iata: "ORD", name: "O'Hare International", nameZh: "奧黑爾國際機場", city: "Chicago", cityZh: "芝加哥", country: "USA", countryZh: "美國" },
  { iata: "SEA", name: "Seattle-Tacoma International", nameZh: "西雅圖機場", city: "Seattle", cityZh: "西雅圖", country: "USA", countryZh: "美國" },
  { iata: "YYZ", name: "Toronto Pearson International", nameZh: "多倫多皮爾遜機場", city: "Toronto", cityZh: "多倫多", country: "Canada", countryZh: "加拿大" },
  { iata: "YVR", name: "Vancouver International", nameZh: "溫哥華國際機場", city: "Vancouver", cityZh: "溫哥華", country: "Canada", countryZh: "加拿大" },
  // Australia / Pacific
  { iata: "SYD", name: "Kingsford Smith Airport", nameZh: "雪梨機場", city: "Sydney", cityZh: "雪梨", country: "Australia", countryZh: "澳洲" },
  { iata: "MEL", name: "Melbourne Airport", nameZh: "墨爾本機場", city: "Melbourne", cityZh: "墨爾本", country: "Australia", countryZh: "澳洲" },
  { iata: "BNE", name: "Brisbane Airport", nameZh: "布里斯本機場", city: "Brisbane", cityZh: "布里斯本", country: "Australia", countryZh: "澳洲" },
  { iata: "AKL", name: "Auckland Airport", nameZh: "奧克蘭機場", city: "Auckland", cityZh: "奧克蘭", country: "New Zealand", countryZh: "紐西蘭" },
  { iata: "GUM", name: "Guam International", nameZh: "關島機場", city: "Guam", cityZh: "關島", country: "Guam", countryZh: "關島" },
];

export function searchAirports(query: string): Airport[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return AIRPORTS.filter((a) =>
    a.iata.toLowerCase().startsWith(q) ||
    a.city.toLowerCase().includes(q) ||
    a.cityZh.includes(q) ||
    a.country.toLowerCase().includes(q) ||
    a.countryZh.includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.nameZh.includes(q)
  ).slice(0, 6);
}
