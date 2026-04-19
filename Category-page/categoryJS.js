
const CATALOGUE = {

  cpu: {
    meta: { label: 'CPU', sub: 'Processor', icon: '🔲', filters: ['All','Intel','AMD','Budget','High-End'] },
    parts: [
      { id:'cpu-001', name:'AMD Ryzen 9 7950X', brand:'AMD', emoji:'🔲',
        specs:[{k:'Cores',v:'16C / 32T'},{k:'Boost',v:'5.7 GHz'},{k:'TDP',v:'170W'},{k:'Socket',v:'AM5'}],
        watts:170, bench:{score:62800,tier:'s',source:'Cinebench R23'}, avail:'in',
        price:'$699', priceNum:699,
        badges:[{text:'Flagship',color:'purple'},{text:'PCIe 5.0',color:'blue'}],
        deal:null, buyLink:'#' },

      { id:'cpu-002', name:'AMD Ryzen 7 7700X', brand:'AMD', emoji:'🔲',
        specs:[{k:'Cores',v:'8C / 16T'},{k:'Boost',v:'5.4 GHz'},{k:'TDP',v:'105W'},{k:'Socket',v:'AM5'}],
        watts:105, bench:{score:38400,tier:'a',source:'Cinebench R23'}, avail:'in',
        price:'$299', priceNum:299,
        badges:[{text:'Great Value',color:'green'}],
        deal:'$20 off this week', buyLink:'#' },

      { id:'cpu-003', name:'Intel Core i9-13900K', brand:'Intel', emoji:'🔲',
        specs:[{k:'Cores',v:'24C / 32T'},{k:'Boost',v:'5.8 GHz'},{k:'TDP',v:'253W'},{k:'Socket',v:'LGA1700'}],
        watts:253, bench:{score:61200,tier:'s',source:'Cinebench R23'}, avail:'low',
        price:'$549', priceNum:549,
        badges:[{text:'High Power',color:'amber'}],
        deal:null, buyLink:'#' },

      { id:'cpu-004', name:'Intel Core i5-13600K', brand:'Intel', emoji:'🔲',
        specs:[{k:'Cores',v:'14C / 20T'},{k:'Boost',v:'5.1 GHz'},{k:'TDP',v:'125W'},{k:'Socket',v:'LGA1700'}],
        watts:125, bench:{score:27900,tier:'b',source:'Cinebench R23'}, avail:'in',
        price:'$289', priceNum:289,
        badges:[{text:'Best Mid-Range',color:'green'}],
        deal:null, buyLink:'#' },

      { id:'cpu-005', name:'AMD Ryzen 5 7600', brand:'AMD', emoji:'🔲',
        specs:[{k:'Cores',v:'6C / 12T'},{k:'Boost',v:'5.1 GHz'},{k:'TDP',v:'65W'},{k:'Socket',v:'AM5'}],
        watts:65, bench:{score:19800,tier:'b',source:'Cinebench R23'}, avail:'in',
        price:'$199', priceNum:199,
        badges:[{text:'Budget Pick',color:'blue'},{text:'Low Power',color:'green'}],
        deal:'Best seller', buyLink:'#' },

      { id:'cpu-006', name:'Intel Core i3-13100', brand:'Intel', emoji:'🔲',
        specs:[{k:'Cores',v:'4C / 8T'},{k:'Boost',v:'4.5 GHz'},{k:'TDP',v:'60W'},{k:'Socket',v:'LGA1700'}],
        watts:60, bench:{score:9700,tier:'c',source:'Cinebench R23'}, avail:'in',
        price:'$129', priceNum:129,
        badges:[{text:'Entry Level',color:'amber'}],
        deal:null, buyLink:'#' },
    ]
  },

  motherboard: {
    meta: { label:'Motherboard', sub:'Main Board', icon:'🖥️', filters:['All','Intel','AMD','ATX','mATX','Mini-ITX'] },
    parts: [
      { id:'mb-001', name:'ASUS ROG Strix X670E-E', brand:'ASUS', emoji:'🖥️',
        specs:[{k:'Socket',v:'AM5'},{k:'Form',v:'ATX'},{k:'RAM',v:'DDR5 6400+'},{k:'PCIe',v:'5.0 x16'}],
        watts:50, bench:null, avail:'in', price:'$499', priceNum:499,
        badges:[{text:'PCIe 5.0',color:'blue'},{text:'Wi-Fi 6E',color:'green'}], deal:null, buyLink:'#' },

      { id:'mb-002', name:'MSI MAG B650 Tomahawk', brand:'MSI', emoji:'🖥️',
        specs:[{k:'Socket',v:'AM5'},{k:'Form',v:'ATX'},{k:'RAM',v:'DDR5 6000+'},{k:'PCIe',v:'4.0 x16'}],
        watts:35, bench:null, avail:'in', price:'$199', priceNum:199,
        badges:[{text:'Great Value',color:'green'}], deal:'$10 off', buyLink:'#' },

      { id:'mb-003', name:'Gigabyte Z790 AORUS Master', brand:'Gigabyte', emoji:'🖥️',
        specs:[{k:'Socket',v:'LGA1700'},{k:'Form',v:'ATX'},{k:'RAM',v:'DDR5 7600+'},{k:'PCIe',v:'5.0 x16'}],
        watts:55, bench:null, avail:'low', price:'$579', priceNum:579,
        badges:[{text:'Flagship',color:'purple'}], deal:null, buyLink:'#' },

      { id:'mb-004', name:'ASRock B760M Pro RS', brand:'ASRock', emoji:'🖥️',
        specs:[{k:'Socket',v:'LGA1700'},{k:'Form',v:'mATX'},{k:'RAM',v:'DDR4/5'},{k:'PCIe',v:'4.0 x16'}],
        watts:25, bench:null, avail:'in', price:'$129', priceNum:129,
        badges:[{text:'Budget',color:'amber'}], deal:null, buyLink:'#' },
    ]
  },

  gpu: {
    meta: { label:'Video Card', sub:'GPU', icon:'🎮', filters:['All','NVIDIA','AMD','Budget','Mid-Range','High-End'] },
    parts: [
      { id:'gpu-001', name:'NVIDIA GeForce RTX 4090', brand:'NVIDIA', emoji:'🎮',
        specs:[{k:'VRAM',v:'24 GB GDDR6X'},{k:'TDP',v:'450W'},{k:'Memory BW',v:'1.01 TB/s'},{k:'API',v:'DX12U / Vulkan'}],
        watts:450, bench:{score:38200,tier:'s',source:'3DMark TS'}, avail:'in', price:'$1,599', priceNum:1599,
        badges:[{text:'Best GPU',color:'purple'},{text:'4K Champion',color:'blue'}], deal:null, buyLink:'#' },

      { id:'gpu-002', name:'NVIDIA GeForce RTX 4070 Ti Super', brand:'NVIDIA', emoji:'🎮',
        specs:[{k:'VRAM',v:'16 GB GDDR6X'},{k:'TDP',v:'285W'},{k:'Memory BW',v:'672 GB/s'},{k:'API',v:'DX12U / Vulkan'}],
        watts:285, bench:{score:26800,tier:'a',source:'3DMark TS'}, avail:'in', price:'$799', priceNum:799,
        badges:[{text:'1440p King',color:'green'}], deal:null, buyLink:'#' },

      { id:'gpu-003', name:'AMD Radeon RX 7900 XTX', brand:'AMD', emoji:'🎮',
        specs:[{k:'VRAM',v:'24 GB GDDR6'},{k:'TDP',v:'355W'},{k:'Memory BW',v:'960 GB/s'},{k:'API',v:'DX12U / Vulkan'}],
        watts:355, bench:{score:29100,tier:'a',source:'3DMark TS'}, avail:'in', price:'$899', priceNum:899,
        badges:[{text:'Open Source',color:'blue'}], deal:'$50 rebate', buyLink:'#' },

      { id:'gpu-004', name:'NVIDIA GeForce RTX 4060 Ti', brand:'NVIDIA', emoji:'🎮',
        specs:[{k:'VRAM',v:'8 GB GDDR6'},{k:'TDP',v:'165W'},{k:'Memory BW',v:'288 GB/s'},{k:'API',v:'DX12U / Vulkan'}],
        watts:165, bench:{score:15700,tier:'b',source:'3DMark TS'}, avail:'in', price:'$399', priceNum:399,
        badges:[{text:'1080p Sweet Spot',color:'green'}], deal:null, buyLink:'#' },

      { id:'gpu-005', name:'AMD Radeon RX 7600', brand:'AMD', emoji:'🎮',
        specs:[{k:'VRAM',v:'8 GB GDDR6'},{k:'TDP',v:'165W'},{k:'Memory BW',v:'288 GB/s'},{k:'API',v:'DX12U / Vulkan'}],
        watts:165, bench:{score:12100,tier:'b',source:'3DMark TS'}, avail:'in', price:'$269', priceNum:269,
        badges:[{text:'Budget',color:'amber'}], deal:null, buyLink:'#' },
    ]
  },

  memory: {
    meta: { label:'Memory', sub:'RAM', icon:'💾', filters:['All','DDR4','DDR5','16 GB','32 GB','64 GB'] },
    parts: [
      { id:'ram-001', name:'G.Skill Trident Z5 RGB 32GB', brand:'G.Skill', emoji:'💾',
        specs:[{k:'Type',v:'DDR5-6000'},{k:'Size',v:'2×16 GB'},{k:'Latency',v:'CL36'},{k:'Voltage',v:'1.35V'}],
        watts:5, bench:null, avail:'in', price:'$139', priceNum:139,
        badges:[{text:'DDR5',color:'blue'},{text:'RGB',color:'purple'}], deal:null, buyLink:'#' },

      { id:'ram-002', name:'Corsair Vengeance 32GB', brand:'Corsair', emoji:'💾',
        specs:[{k:'Type',v:'DDR5-5600'},{k:'Size',v:'2×16 GB'},{k:'Latency',v:'CL40'},{k:'Voltage',v:'1.25V'}],
        watts:4, bench:null, avail:'in', price:'$99', priceNum:99,
        badges:[{text:'DDR5',color:'blue'},{text:'Great Value',color:'green'}], deal:'$15 off', buyLink:'#' },

      { id:'ram-003', name:'Kingston Fury Beast 64GB', brand:'Kingston', emoji:'💾',
        specs:[{k:'Type',v:'DDR5-6000'},{k:'Size',v:'2×32 GB'},{k:'Latency',v:'CL38'},{k:'Voltage',v:'1.35V'}],
        watts:6, bench:null, avail:'in', price:'$219', priceNum:219,
        badges:[{text:'High Capacity',color:'purple'}], deal:null, buyLink:'#' },

      { id:'ram-004', name:'G.Skill Ripjaws V 32GB', brand:'G.Skill', emoji:'💾',
        specs:[{k:'Type',v:'DDR4-3600'},{k:'Size',v:'2×16 GB'},{k:'Latency',v:'CL16'},{k:'Voltage',v:'1.35V'}],
        watts:4, bench:null, avail:'in', price:'$79', priceNum:79,
        badges:[{text:'DDR4',color:'amber'},{text:'Budget',color:'green'}], deal:null, buyLink:'#' },
    ]
  },

  memory2: {
    meta: { label:'Memory Slot 2', sub:'Dual-Channel RAM', icon:'💾', filters:['All','DDR4','DDR5','16 GB','32 GB','64 GB'] },
    parts: [
      { id:'ram-001', name:'G.Skill Trident Z5 RGB 32GB', brand:'G.Skill', emoji:'💾',
        specs:[{k:'Type',v:'DDR5-6000'},{k:'Size',v:'2×16 GB'},{k:'Latency',v:'CL36'},{k:'Voltage',v:'1.35V'}],
        watts:5, bench:null, avail:'in', price:'$139', priceNum:139,
        badges:[{text:'DDR5',color:'blue'},{text:'RGB',color:'purple'}], deal:null, buyLink:'#' },

      { id:'ram-002', name:'Corsair Vengeance 32GB', brand:'Corsair', emoji:'💾',
        specs:[{k:'Type',v:'DDR5-5600'},{k:'Size',v:'2×16 GB'},{k:'Latency',v:'CL40'},{k:'Voltage',v:'1.25V'}],
        watts:4, bench:null, avail:'in', price:'$99', priceNum:99,
        badges:[{text:'DDR5',color:'blue'},{text:'Great Value',color:'green'}], deal:'$15 off', buyLink:'#' },

      { id:'ram-004', name:'G.Skill Ripjaws V 32GB', brand:'G.Skill', emoji:'💾',
        specs:[{k:'Type',v:'DDR4-3600'},{k:'Size',v:'2×16 GB'},{k:'Latency',v:'CL16'},{k:'Voltage',v:'1.35V'}],
        watts:4, bench:null, avail:'in', price:'$79', priceNum:79,
        badges:[{text:'DDR4',color:'amber'},{text:'Budget',color:'green'}], deal:null, buyLink:'#' },
    ]
  },

  storage: {
    meta: { label:'Storage', sub:'SSD / HDD', icon:'💿', filters:['All','NVMe','SATA SSD','HDD','1TB','2TB','4TB+'] },
    parts: [
      { id:'sto-001', name:'Samsung 990 Pro 2TB', brand:'Samsung', emoji:'💿',
        specs:[{k:'Type',v:'NVMe PCIe 4.0'},{k:'Read',v:'7,450 MB/s'},{k:'Write',v:'6,900 MB/s'},{k:'Form',v:'M.2 2280'}],
        watts:7, bench:null, avail:'in', price:'$149', priceNum:149,
        badges:[{text:'Top Pick',color:'green'},{text:'PCIe 4.0',color:'blue'}], deal:null, buyLink:'#' },

      { id:'sto-002', name:'WD Black SN850X 1TB', brand:'WD', emoji:'💿',
        specs:[{k:'Type',v:'NVMe PCIe 4.0'},{k:'Read',v:'7,300 MB/s'},{k:'Write',v:'6,300 MB/s'},{k:'Form',v:'M.2 2280'}],
        watts:6, bench:null, avail:'in', price:'$99', priceNum:99,
        badges:[{text:'Fast',color:'blue'}], deal:'$10 off', buyLink:'#' },

      { id:'sto-003', name:'Seagate Barracuda 4TB HDD', brand:'Seagate', emoji:'💿',
        specs:[{k:'Type',v:'HDD SATA'},{k:'Speed',v:'5400 RPM'},{k:'Cache',v:'256 MB'},{k:'Form',v:'3.5"'}],
        watts:9, bench:null, avail:'in', price:'$79', priceNum:79,
        badges:[{text:'High Capacity',color:'purple'}], deal:null, buyLink:'#' },

      { id:'sto-004', name:'Crucial MX500 1TB SATA', brand:'Crucial', emoji:'💿',
        specs:[{k:'Type',v:'SATA SSD'},{k:'Read',v:'560 MB/s'},{k:'Write',v:'510 MB/s'},{k:'Form',v:'2.5"'}],
        watts:3, bench:null, avail:'in', price:'$59', priceNum:59,
        badges:[{text:'Budget',color:'amber'}], deal:null, buyLink:'#' },
    ]
  },

  psu: {
    meta: { label:'Power Supply', sub:'PSU', icon:'🔌', filters:['All','550W','650W','750W','850W','1000W+','80+ Gold','80+ Platinum'] },
    parts: [
      { id:'psu-001', name:'Seasonic Focus GX-1000', brand:'Seasonic', emoji:'🔌',
        specs:[{k:'Wattage',v:'1000W'},{k:'Rating',v:'80+ Gold'},{k:'Modular',v:'Fully'},{k:'Fan',v:'135mm'}],
        watts:1000, bench:null, avail:'in', price:'$179', priceNum:179,
        badges:[{text:'Fully Modular',color:'blue'},{text:'80+ Gold',color:'amber'}], deal:null, buyLink:'#' },

      { id:'psu-002', name:'Corsair RM850x', brand:'Corsair', emoji:'🔌',
        specs:[{k:'Wattage',v:'850W'},{k:'Rating',v:'80+ Gold'},{k:'Modular',v:'Fully'},{k:'Fan',v:'135mm'}],
        watts:850, bench:null, avail:'in', price:'$139', priceNum:139,
        badges:[{text:'Great Value',color:'green'},{text:'Quiet',color:'blue'}], deal:'$20 off', buyLink:'#' },

      { id:'psu-003', name:'be quiet! Straight Power 12 1000W', brand:'be quiet!', emoji:'🔌',
        specs:[{k:'Wattage',v:'1000W'},{k:'Rating',v:'80+ Platinum'},{k:'Modular',v:'Fully'},{k:'Fan',v:'135mm'}],
        watts:1000, bench:null, avail:'in', price:'$219', priceNum:219,
        badges:[{text:'80+ Platinum',color:'purple'},{text:'Silent',color:'green'}], deal:null, buyLink:'#' },

      { id:'psu-004', name:'EVGA SuperNOVA 650 G6', brand:'EVGA', emoji:'🔌',
        specs:[{k:'Wattage',v:'650W'},{k:'Rating',v:'80+ Gold'},{k:'Modular',v:'Fully'},{k:'Fan',v:'140mm'}],
        watts:650, bench:null, avail:'in', price:'$89', priceNum:89,
        badges:[{text:'Budget',color:'amber'}], deal:null, buyLink:'#' },
    ]
  },

  case: {
    meta: { label:'Case', sub:'Enclosure', icon:'🗄️', filters:['All','ATX','mATX','Mini-ITX','Full Tower','Mid Tower'] },
    parts: [
      { id:'case-001', name:'Lian Li O11 Dynamic EVO', brand:'Lian Li', emoji:'🗄️',
        specs:[{k:'Form',v:'ATX Mid Tower'},{k:'Fans',v:'Up to 10×120mm'},{k:'GPU',v:'Up to 435mm'},{k:'Window',v:'Tempered Glass'}],
        watts:null, bench:null, avail:'in', price:'$169', priceNum:169,
        badges:[{text:'Top Pick',color:'green'},{text:'Dual Chamber',color:'blue'}], deal:null, buyLink:'#' },

      { id:'case-002', name:'Fractal Design Torrent', brand:'Fractal', emoji:'🗄️',
        specs:[{k:'Form',v:'ATX Mid Tower'},{k:'Fans',v:'2×180mm Front'},{k:'GPU',v:'Up to 467mm'},{k:'Window',v:'Tempered Glass'}],
        watts:null, bench:null, avail:'in', price:'$189', priceNum:189,
        badges:[{text:'Best Airflow',color:'amber'}], deal:null, buyLink:'#' },

      { id:'case-003', name:'NZXT H7 Flow', brand:'NZXT', emoji:'🗄️',
        specs:[{k:'Form',v:'ATX Mid Tower'},{k:'Fans',v:'2×140mm included'},{k:'GPU',v:'Up to 400mm'},{k:'Window',v:'Tempered Glass'}],
        watts:null, bench:null, avail:'in', price:'$119', priceNum:119,
        badges:[{text:'Clean Look',color:'purple'}], deal:'$20 off', buyLink:'#' },
    ]
  },

  cooler: {
    meta: { label:'CPU Cooler', sub:'Thermal Solution', icon:'❄️', filters:['All','Air Cooler','240mm AIO','280mm AIO','360mm AIO'] },
    parts: [
      { id:'cool-001', name:'Noctua NH-D15', brand:'Noctua', emoji:'❄️',
        specs:[{k:'Type',v:'Air Cooler'},{k:'TDP',v:'250W+'},{k:'Fans',v:'2×140mm'},{k:'Height',v:'165mm'}],
        watts:5, bench:{score:97,tier:'s',source:'Thermal %'}, avail:'in', price:'$109', priceNum:109,
        badges:[{text:'Best Air Cooler',color:'green'}], deal:null, buyLink:'#' },

      { id:'cool-002', name:'Arctic Liquid Freezer III 360', brand:'Arctic', emoji:'❄️',
        specs:[{k:'Type',v:'AIO 360mm'},{k:'TDP',v:'350W+'},{k:'Fans',v:'3×120mm'},{k:'Pump',v:'Dual}'}],
        watts:12, bench:{score:99,tier:'s',source:'Thermal %'}, avail:'in', price:'$129', priceNum:129,
        badges:[{text:'Best AIO',color:'blue'},{text:'360mm',color:'purple'}], deal:'$20 off', buyLink:'#' },

      { id:'cool-003', name:'Corsair H100i Elite', brand:'Corsair', emoji:'❄️',
        specs:[{k:'Type',v:'AIO 240mm'},{k:'TDP',v:'250W+'},{k:'Fans',v:'2×120mm RGB'},{k:'Control',v:'iCUE'}],
        watts:10, bench:{score:88,tier:'a',source:'Thermal %'}, avail:'in', price:'$139', priceNum:139,
        badges:[{text:'RGB',color:'purple'}], deal:null, buyLink:'#' },

      { id:'cool-004', name:'be quiet! Pure Rock 2', brand:'be quiet!', emoji:'❄️',
        specs:[{k:'Type',v:'Air Cooler'},{k:'TDP',v:'150W'},{k:'Fans',v:'1×120mm'},{k:'Height',v:'155mm'}],
        watts:3, bench:{score:75,tier:'b',source:'Thermal %'}, avail:'in', price:'$39', priceNum:39,
        badges:[{text:'Budget',color:'amber'},{text:'Silent',color:'green'}], deal:null, buyLink:'#' },
    ]
  },

  monitor: {
    meta: { label:'Monitor', sub:'Display', icon:'🖥', filters:['All','1080p','1440p','4K','144Hz+','OLED','IPS'] },
    parts: [
      { id:'mon-001', name:'LG 27GP950-B 4K 144Hz', brand:'LG', emoji:'🖥',
        specs:[{k:'Size',v:'27"'},{k:'Res',v:'4K UHD'},{k:'Rate',v:'144Hz'},{k:'Panel',v:'Nano IPS'}],
        watts:null, bench:null, avail:'in', price:'$549', priceNum:549,
        badges:[{text:'4K 144Hz',color:'purple'},{text:'G-Sync',color:'blue'}], deal:null, buyLink:'#' },

      { id:'mon-002', name:'Samsung Odyssey G7 1440p 240Hz', brand:'Samsung', emoji:'🖥',
        specs:[{k:'Size',v:'27"'},{k:'Res',v:'1440p QHD'},{k:'Rate',v:'240Hz'},{k:'Panel',v:'VA 1ms'}],
        watts:null, bench:null, avail:'in', price:'$399', priceNum:399,
        badges:[{text:'240Hz',color:'green'},{text:'Curved',color:'amber'}], deal:'$50 off', buyLink:'#' },

      { id:'mon-003', name:'ASUS ROG Swift OLED PG27AQDM', brand:'ASUS', emoji:'🖥',
        specs:[{k:'Size',v:'27"'},{k:'Res',v:'1440p QHD'},{k:'Rate',v:'240Hz'},{k:'Panel',v:'OLED 0.03ms'}],
        watts:null, bench:null, avail:'low', price:'$799', priceNum:799,
        badges:[{text:'OLED',color:'purple'},{text:'Best Color',color:'blue'}], deal:null, buyLink:'#' },
    ]
  },

  keyboard: {
    meta: { label:'Keyboard', sub:'Input Device', icon:'⌨️', filters:['All','Mechanical','Membrane','TKL','Full Size','60%','Wireless'] },
    parts: [
      { id:'kb-001', name:'Keychron Q1 Pro', brand:'Keychron', emoji:'⌨️',
        specs:[{k:'Layout',v:'75% TKL'},{k:'Switch',v:'Gateron G Pro'},{k:'Connect',v:'BT5.1 / USB-C'},{k:'Build',v:'Aluminum'}],
        watts:null, bench:null, avail:'in', price:'$199', priceNum:199,
        badges:[{text:'Wireless',color:'blue'},{text:'Hot-swap',color:'green'}], deal:null, buyLink:'#' },

      { id:'kb-002', name:'Logitech G Pro X TKL', brand:'Logitech', emoji:'⌨️',
        specs:[{k:'Layout',v:'TKL 87%'},{k:'Switch',v:'GX Blue / Brown'},{k:'Connect',v:'USB-A'},{k:'RGB',v:'LIGHTSYNC'}],
        watts:null, bench:null, avail:'in', price:'$129', priceNum:129,
        badges:[{text:'Gaming',color:'amber'}], deal:null, buyLink:'#' },

      { id:'kb-003', name:'Ducky One 3 Mini', brand:'Ducky', emoji:'⌨️',
        specs:[{k:'Layout',v:'60%'},{k:'Switch',v:'Cherry MX'},{k:'Connect',v:'USB-C'},{k:'RGB',v:'Per-key RGB'}],
        watts:null, bench:null, avail:'in', price:'$109', priceNum:109,
        badges:[{text:'Compact',color:'purple'}], deal:null, buyLink:'#' },
    ]
  },

  mouse: {
    meta: { label:'Mouse', sub:'Input Device', icon:'🖱️', filters:['All','Gaming','Wireless','Lightweight','Ergonomic'] },
    parts: [
      { id:'ms-001', name:'Logitech G Pro X Superlight 2', brand:'Logitech', emoji:'🖱️',
        specs:[{k:'Weight',v:'60g'},{k:'DPI',v:'100–32,000'},{k:'Sensor',v:'HERO 2'},{k:'Connect',v:'Wireless 2.4GHz'}],
        watts:null, bench:null, avail:'in', price:'$159', priceNum:159,
        badges:[{text:'Ultralight',color:'blue'},{text:'Wireless',color:'green'}], deal:null, buyLink:'#' },

      { id:'ms-002', name:'Razer DeathAdder V3 HyperSpeed', brand:'Razer', emoji:'🖱️',
        specs:[{k:'Weight',v:'71g'},{k:'DPI',v:'100–26,000'},{k:'Sensor',v:'Focus X'},{k:'Connect',v:'Wireless 2.4GHz'}],
        watts:null, bench:null, avail:'in', price:'$99', priceNum:99,
        badges:[{text:'Ergonomic',color:'amber'}], deal:'$20 off', buyLink:'#' },

      { id:'ms-003', name:'SteelSeries Aerox 3', brand:'SteelSeries', emoji:'🖱️',
        specs:[{k:'Weight',v:'68g'},{k:'DPI',v:'100–18,000'},{k:'Sensor',v:'TrueMove Air'},{k:'Connect',v:'Wired USB-C'}],
        watts:null, bench:null, avail:'in', price:'$59', priceNum:59,
        badges:[{text:'Budget',color:'amber'},{text:'Honeycomb',color:'purple'}], deal:null, buyLink:'#' },
    ]
  },

  headset: {
    meta: { label:'Headset', sub:'Audio', icon:'🎧', filters:['All','Wired','Wireless','Surround Sound','Budget','Premium'] },
    parts: [
      { id:'hs-001', name:'SteelSeries Arctis Nova Pro Wireless', brand:'SteelSeries', emoji:'🎧',
        specs:[{k:'Driver',v:'40mm Neodymium'},{k:'Freq',v:'10–40,000 Hz'},{k:'Connect',v:'Wireless + BT'},{k:'Battery',v:'36hr'}],
        watts:null, bench:null, avail:'in', price:'$349', priceNum:349,
        badges:[{text:'Premium',color:'purple'},{text:'Hi-Res Audio',color:'blue'}], deal:null, buyLink:'#' },

      { id:'hs-002', name:'HyperX Cloud Alpha', brand:'HyperX', emoji:'🎧',
        specs:[{k:'Driver',v:'50mm Dual Chamber'},{k:'Freq',v:'13–27,000 Hz'},{k:'Connect',v:'3.5mm / USB'},{k:'Weight',v:'336g'}],
        watts:null, bench:null, avail:'in', price:'$99', priceNum:99,
        badges:[{text:'Best Value',color:'green'}], deal:'$30 off', buyLink:'#' },

      { id:'hs-003', name:'Razer BlackShark V2 X', brand:'Razer', emoji:'🎧',
        specs:[{k:'Driver',v:'50mm'},{k:'Freq',v:'12–28,000 Hz'},{k:'Connect',v:'3.5mm'},{k:'Weight',v:'240g'}],
        watts:null, bench:null, avail:'in', price:'$59', priceNum:59,
        badges:[{text:'Budget',color:'amber'},{text:'Lightweight',color:'green'}], deal:null, buyLink:'#' },
    ]
  },
};

function getParams() {
  const p = new URLSearchParams(location.search);
  return { category: p.get('category') || 'cpu', from: p.get('from') || 'builder' };
}
function getParts() { try { return JSON.parse(sessionStorage.getItem('builderParts') || '{}'); } catch { return {}; } }
function saveParts(p) { sessionStorage.setItem('builderParts', JSON.stringify(p)); }

const { category, from } = getParams();
const cat = CATALOGUE[category] || CATALOGUE['cpu'];
const meta = cat.meta;

let activeFilter  = 'All';
let searchQuery   = '';
let sortMode      = 'default';
let selectedPartId = getParts()[category]?.id || null;

document.title = `PC Builder · ${meta.label}`;
document.getElementById('catIcon').textContent        = meta.icon;
document.getElementById('catTitle').textContent       = `Choose ${meta.label}`;
document.getElementById('catSubtitle').textContent    = `Select the best ${meta.sub.toLowerCase()} for your build`;
document.getElementById('breadcrumbCat').textContent  = meta.label;
document.getElementById('backBtn').href = from === 'home' ? '../home-page/index.html' : '../builder-page/builder_index.html';

const fg = document.getElementById('filterGroup');
(meta.filters || ['All']).forEach(f => {
  const btn = document.createElement('button');
  btn.className = 'filter-btn' + (f === 'All' ? ' active' : '');
  btn.textContent = f;
  btn.addEventListener('click', () => {
    activeFilter = f;
    fg.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTable();
  });
  fg.appendChild(btn);
});

document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value.toLowerCase();
  renderTable();
});
document.getElementById('sortSelect').addEventListener('change', e => {
  sortMode = e.target.value;
  renderTable();
});

function wattageHTML(watts) {
  if (watts === null || watts === undefined) return '<span class="dash">—</span>';
  const pct = Math.min((watts / 500) * 100, 100);
  const cls = watts < 100 ? 'watt-low' : watts < 250 ? 'watt-mid' : 'watt-high';
  return `<div class="wattage-val"><span>${watts}W</span>
    <div class="wattage-bar-track"><div class="wattage-bar-fill ${cls}" style="width:${pct}%"></div></div>
  </div>`;
}
function benchHTML(bench) {
  if (!bench) return '<span class="dash">—</span>';
  return `<div class="bench-cell">
    <span class="bench-score bench-${bench.tier}">${bench.score.toLocaleString()}</span>
    <span class="bench-source">${bench.source}</span>
  </div>`;
}
function availHTML(avail) {
  if (!avail) return '<span class="dash">—</span>';
  const map = { in: ['avail-in','In Stock'], low: ['avail-low','Low Stock'], out: ['avail-out','Out of Stock'] };
  const [cls, label] = map[avail] || map.in;
  return `<span class="avail-pill ${cls}"><span class="avail-dot"></span>${label}</span>`;
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function getFiltered() {
  let list = [...cat.parts];
  if (searchQuery) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.brand.toLowerCase().includes(searchQuery) ||
      (p.specs||[]).some(s => s.v.toLowerCase().includes(searchQuery))
    );
  }
  if (activeFilter !== 'All') {
    list = list.filter(p =>
      p.name.toLowerCase().includes(activeFilter.toLowerCase()) ||
      p.brand.toLowerCase().includes(activeFilter.toLowerCase()) ||
      (p.badges||[]).some(b => b.text.toLowerCase().includes(activeFilter.toLowerCase())) ||
      (p.specs||[]).some(s =>
        s.v.toLowerCase().includes(activeFilter.toLowerCase()) ||
        s.k.toLowerCase().includes(activeFilter.toLowerCase())
      )
    );
  }
  if (sortMode === 'price-asc')   list.sort((a,b) => (a.priceNum||0) - (b.priceNum||0));
  if (sortMode === 'price-desc')  list.sort((a,b) => (b.priceNum||0) - (a.priceNum||0));
  if (sortMode === 'bench-desc')  list.sort((a,b) => (b.bench?.score||0) - (a.bench?.score||0));
  if (sortMode === 'watt-asc')    list.sort((a,b) => (a.watts||999) - (b.watts||999));
  return list;
}

function renderTable() {
  const tbody = document.getElementById('partsBody');
  tbody.innerHTML = '';
  const list = getFiltered();
  document.getElementById('resultsCount').innerHTML = `<span>${list.length}</span> result${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7">
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <strong>No parts found</strong>
        Try adjusting your search or filter
      </div>
    </td>`;
    tbody.appendChild(tr); return;
  }

  list.forEach((part, i) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${i * 30}ms`;

    const badges = (part.badges||[]).map(b => `<span class="badge badge-${b.color}">${b.text}</span>`).join('');
    const specsHTML = (part.specs||[]).map(s =>
      `<div class="spec-row"><span class="spec-key">${s.k}</span><span class="spec-val">${s.v}</span></div>`
    ).join('');

    const isSelected = part.id === selectedPartId;
    const btnLabel  = isSelected ? '✓ Selected' : 'Add to Build';
    const btnClass  = 'btn-select' + (isSelected ? ' selected' : '');

    tr.innerHTML = `
      <td class="col-info">
        <div class="pi-wrap">
          <div class="pi-thumb">${part.emoji}</div>
          <div>
            <div class="pi-name">${part.name}</div>
            <div class="pi-brand">${part.brand}</div>
            ${badges ? `<div class="pi-badges">${badges}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="col-specs"><div class="specs-list">${specsHTML}</div></td>
      <td class="col-watt2">${wattageHTML(part.watts)}</td>
      <td class="col-bench2">${benchHTML(part.bench)}</td>
      <td class="col-avail2">${availHTML(part.avail)}</td>
      <td class="col-price2">
        <div class="price-val">${part.price || '—'}</div>
        ${part.deal ? `<div class="price-deal">${part.deal}</div>` : ''}
      </td>
      <td class="col-act">
        <div class="act-wrap">
          <button class="${btnClass}" data-id="${part.id}">${btnLabel}</button>
          ${part.buyLink && !isSelected
            ? `<a href="${part.buyLink}" class="btn-details" target="_blank">View deal ↗</a>`
            : '<span></span>'}
        </div>
      </td>`;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-select:not(.selected)').forEach(btn => {
    btn.addEventListener('click', () => {
      const partId = btn.dataset.id;
      const part   = cat.parts.find(p => p.id === partId);
      if (!part) return;

      const parts = getParts();
      if (category === 'psu') {
        const wattSpec = (part.specs || []).find(s => s.k === 'Wattage');
        if (wattSpec) part.capacity = parseInt(wattSpec.v);
      }
      parts[category] = part;
      
      if (category === 'memory') delete parts['memory2'];
      saveParts(parts);

      selectedPartId = partId;
      showToast(`✓ ${part.name} added to build`);
      setTimeout(() => { window.location.href = '../builder-page/builder_index.html'; }, 700);
    });
  });
}

renderTable();
