// Mock data for static demo prototype (supon-b2b-demo)

window.CURRENT_USER = {
  name: "Tomasz Dyrektor",
  role: "Dyrektor Operacyjny (CLIENT_HEAD)",
  company: "DEMO — Firma Prezentacyjna Sp. z o.o.",
  email: "demo@suponkielce.pl",
  initials: "TD"
};

window.MOCK_BRANCHES = [
  { id: "b1", name: "Oddział Północ — Kielce", address: "ul. Testowa 5, 25-001 Kielce" },
  { id: "b2", name: "Oddział Południe — Radom", address: "ul. Wzornicza 12, 26-600 Radom" }
];

window.MOCK_EMPLOYEES = [
  { id: "emp1", nr: "NP-0101", name: "Adam Nowak", position: "Spawacz TIG / MAG", branch: "Oddział Północ — Kielce", sizes: "Buty 43, Ubranie L (52), Klatka 104cm" },
  { id: "emp2", nr: "NP-0102", name: "Piotr Zieliński", position: "Operator Tokarki CNC", branch: "Oddział Północ — Kielce", sizes: "Buty 42, Ubranie M (50), Klatka 98cm" },
  { id: "emp3", nr: "NP-0103", name: "Krzysztof Maj", position: "Kierownik Zespołu Montażu", branch: "Oddział Południe — Radom", sizes: "Buty 44, Ubranie XL (54), Klatka 110cm" },
  { id: "emp4", nr: "NP-0104", name: "Michał Lewandowski", position: "Elektryk Zakładowy", branch: "Oddział Południe — Radom", sizes: "Buty 41, Ubranie M (50), Klatka 96cm" },
  { id: "emp5", nr: "NP-0105", name: "Grzegorz Kamiński", position: "Magazynier Wyrobów", branch: "Oddział Północ — Kielce", sizes: "Buty 43, Ubranie L (52), Klatka 102cm" }
];

window.DEFAULT_ORDERS = [
  {
    id: "Z-2026-DEMO12",
    created: "2026-08-17",
    eta: "18.08.2026",
    addr: "Oddział Północ — Kielce, ul. Testowa 5",
    clientRef: "ZAM/BHP/2026/301",
    department: "Dział Utrzymania Ruchu",
    status: "W realizacji",
    items: [
      { produkt: "Rękawice robocze Grip", nr: "R-20", rozmiar: "9 (L)", ilosc: 30, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Dział Utrzymania Ruchu", foto: "foto/rekawice.png" },
      { produkt: "Bluza Hi-Vis", nr: "HIV-BLS-110", rozmiar: "M", ilosc: 5, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Robert Kowalczyk", foto: "foto/bluza.png" }
    ],
    dostawy: []
  },
  {
    id: "Z-2026-DEMO08",
    created: "2026-08-17",
    eta: "18.08.2026",
    addr: "Oddział Północ — Kielce, ul. Testowa 5",
    clientRef: "PO/BHP/2026/088",
    department: "Dział Montażu i Grawerowania",
    status: "W realizacji",
    items: [
      { produkt: "Spodnie Motion", nr: "MOT-TRS-001", rozmiar: "L (52)", ilosc: 6, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Adam Nowak", foto: "foto/spodnie.png" },
      { produkt: "Buty ochronne S3", nr: "BUT-002", rozmiar: "43", ilosc: 3, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Piotr Zieliński", foto: "foto/buty.png" },
      { produkt: "Kurtka FR (Trudnopalna)", nr: "FR-JKT-220", rozmiar: "XL", ilosc: 2, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Grzegorz Kamiński", foto: "foto/kurtka.png" }
    ],
    dostawy: []
  },
  {
    id: "Z-2026-DEMO11",
    created: "2026-08-17",
    eta: "18.08.2026",
    addr: "Oddział Południe — Radom, ul. Wzornicza 12",
    clientRef: "PO/WYM/2026/015",
    department: "Spawalnia TIG",
    status: "W realizacji",
    items: [
      { produkt: "Kurtka FR (Trudnopalna)", nr: "FR-JKT-220", rozmiar: "L", ilosc: 2, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Michał Lewandowski (Wymiana)", foto: "foto/kurtka.png" }
    ],
    dostawy: []
  },
  {
    id: "Z-2026-DEMO05",
    created: "2026-08-15",
    eta: "16.08.2026",
    addr: "Oddział Północ — Kielce, ul. Testowa 5",
    clientRef: "WYM/2026/011",
    department: "Główny Warsztat",
    status: "W realizacji",
    items: [
      { produkt: "Spodnie Motion", nr: "MOT-TRS-001", rozmiar: "M (50)", ilosc: 2, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Robert Kowalczyk", foto: "foto/spodnie.png" }
    ],
    dostawy: []
  },
  {
    id: "Z-2026-DEMO09",
    created: "2026-08-17",
    eta: "19.08.2026",
    addr: "Oddział Południe — Radom, ul. Wzornicza 12",
    clientRef: "ZAM/SUP/2026/104",
    department: "Hala Obróbki Skrawaniem",
    status: "W realizacji",
    items: [
      { produkt: "Rękawice robocze Grip", nr: "R-20", rozmiar: "10 (XL)", ilosc: 50, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Rozdzielnia BHP", foto: "foto/rekawice.png" },
      { produkt: "Bluza Hi-Vis", nr: "HIV-BLS-110", rozmiar: "L", ilosc: 8, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Krzysztof Maj", foto: "foto/bluza.png" }
    ],
    dostawy: []
  },
  {
    id: "Z-2026-DEMO10",
    created: "2026-08-16",
    eta: "18.08.2026",
    addr: "Oddział Północ — Kielce, ul. Testowa 5",
    clientRef: "PO/2026/08/902",
    department: "Magazyn Główny i Logistyka",
    status: "Częściowo wysłane",
    items: [
      { produkt: "Buty ochronne S3", nr: "BUT-002", rozmiar: "42", ilosc: 10, ilosc_dostarczona: 5, ilosc_wyslana: 5, status: "Dostarczone", osoba: "Michał Lewandowski", foto: "foto/buty.png" },
      { produkt: "Spodnie Motion", nr: "MOT-TRS-001", rozmiar: "L", ilosc: 10, ilosc_dostarczona: 0, ilosc_wyslana: 5, status: "W drodze", osoba: "Adam Nowak", foto: "foto/spodnie.png" }
    ],
    dostawy: [
      { id_wysylki: "WZ/2026/08/201", data_wysylki: "16.08.2026", kurier: "DPD", nr_listu: "000019283746501U", status: "Dostarczona", pozycje: [{ produkt: "Buty ochronne S3", nr: "BUT-002", ilosc: 5 }] },
      { id_wysylki: "WZ/2026/08/202", data_wysylki: "17.08.2026", kurier: "DPD", nr_listu: "000019283746502U", status: "W drodze", pozycje: [{ produkt: "Spodnie Motion", nr: "MOT-TRS-001", ilosc: 5 }] }
    ]
  },
  {
    id: "Z-2026-DEMO04",
    created: "2026-08-14",
    eta: "16.08.2026",
    addr: "Oddział Południe — Radom, ul. Wzornicza 12",
    clientRef: "ZAM/BHP/992",
    department: "Dział Produkcji Śrub",
    status: "Częściowo wysłane",
    items: [
      { produkt: "Bluza Hi-Vis", nr: "HIV-BLS-110", rozmiar: "XL", ilosc: 10, ilosc_dostarczona: 5, ilosc_wyslana: 5, status: "Dostarczone", osoba: "Krzysztof Maj", foto: "foto/bluza.png" },
      { produkt: "Buty ochronne S3", nr: "BUT-002", rozmiar: "42", ilosc: 4, ilosc_dostarczona: 0, ilosc_wyslana: 2, status: "W drodze", osoba: "Michał Lewandowski", foto: "foto/buty.png" }
    ],
    dostawy: [
      { id_wysylki: "WZ/2026/08/088", data_wysylki: "14.08.2026", kurier: "DHL Express", nr_listu: "2837491029481", status: "Dostarczona", pozycje: [{ produkt: "Bluza Hi-Vis", nr: "HIV-BLS-110", ilosc: 5 }] },
      { id_wysylki: "WZ/2026/08/112", data_wysylki: "15.08.2026", kurier: "DHL Express", nr_listu: "2837491029499", status: "W drodze", pozycje: [{ produkt: "Buty ochronne S3", nr: "BUT-002", ilosc: 2 }] }
    ]
  },
  {
    id: "Z-2026-DEMO06",
    created: "2026-08-13",
    eta: "15.08.2026",
    addr: "Oddział Północ — Kielce, ul. Testowa 5",
    clientRef: "PO/DEL/2026/44",
    department: "Magazyn Wyrobów Gotowych",
    status: "Dostarczone",
    items: [
      { produkt: "Kurtka FR (Trudnopalna)", nr: "FR-JKT-220", rozmiar: "44", ilosc: 8, ilosc_dostarczona: 8, ilosc_wyslana: 0, status: "Dostarczone", osoba: "Grzegorz Kamiński", foto: "foto/kurtka.png" }
    ],
    dostawy: [
      { id_wysylki: "WZ/2026/08/042", data_wysylki: "13.08.2026", kurier: "InPost Kurier", nr_listu: "62938471029384759", status: "Dostarczona", pozycje: [{ produkt: "Kurtka FR (Trudnopalna)", nr: "FR-JKT-220", ilosc: 8 }] }
    ]
  },
  {
    id: "Z-2026-DEMO07",
    created: "2026-07-28",
    eta: "30.07.2026",
    addr: "Oddział Południe — Radom, ul. Wzornicza 12",
    clientRef: "APPROVED/2026/099",
    department: "Administracja B2B",
    status: "Zatwierdzone",
    items: [
      { produkt: "Spodnie Motion", nr: "MOT-TRS-001", rozmiar: "XL", ilosc: 12, ilosc_dostarczona: 12, ilosc_wyslana: 0, status: "Dostarczone", osoba: "Zbiorcze dla działu", foto: "foto/spodnie.png" }
    ],
    dostawy: [
      { id_wysylki: "WZ/2026/07/901", data_wysylki: "29.07.2026", kurier: "DPD", nr_listu: "000017263849102U", status: "Dostarczona", pozycje: [{ produkt: "Spodnie Motion", nr: "MOT-TRS-001", ilosc: 12 }] }
    ]
  },
  {
    id: "Z-2026-DEMO03",
    created: "2026-08-12",
    eta: "14.08.2026",
    addr: "Oddział Północ — Kielce, ul. Testowa 5",
    clientRef: "PO/2026/08/015",
    department: "Dział Narzędziowni",
    status: "W realizacji",
    items: [
      { produkt: "Rękawice robocze Grip", nr: "R-20", rozmiar: "9 (L)", ilosc: 5, ilosc_dostarczona: 0, ilosc_wyslana: 0, status: "W realizacji", osoba: "Adam Kowalski", foto: "foto/rekawice.png" }
    ],
    dostawy: []
  },
  {
    id: "Z-2026-DEMO02",
    created: "2026-07-25",
    eta: "27.07.2026",
    addr: "Oddział Północ — Kielce, ul. Testowa 5",
    clientRef: "PO/2026/07/042",
    department: "Spawalnia Główna",
    status: "Wysłane",
    items: [
      { produkt: "Kurtka FR (Trudnopalna)", nr: "FR-JKT-220", rozmiar: "M", ilosc: 1, ilosc_dostarczona: 0, ilosc_wyslana: 1, status: "W drodze", osoba: "Ewa Nowak", foto: "foto/kurtka.png" }
    ],
    dostawy: [
      { id_wysylki: "WZ-2026-07-DEMO2", data_wysylki: "26.07.2026", kurier: "DHL Express", nr_listu: "DHL2233445566", status: "W drodze", pozycje: [{ produkt: "Kurtka FR (Trudnopalna)", nr: "FR-JKT-220", ilosc: 1 }] }
    ]
  },
  {
    id: "Z-2026-DEMO01",
    created: "2026-06-10",
    eta: "12.06.2026",
    addr: "Oddział Północ — Kielce, ul. Testowa 5",
    clientRef: "PO/2026/06/001",
    department: "Dział Utrzymania Ruchu",
    status: "Dostarczone",
    items: [
      { produkt: "Spodnie Motion", nr: "MOT-TRS-001", rozmiar: "L", ilosc: 2, ilosc_dostarczona: 2, ilosc_wyslana: 0, status: "Dostarczone", osoba: "Adam Kowalski", foto: "foto/spodnie.png" },
      { produkt: "Buty ochronne S3", nr: "BUT-002", rozmiar: "43", ilosc: 1, ilosc_dostarczona: 1, ilosc_wyslana: 0, status: "Dostarczone", osoba: "Adam Kowalski", foto: "foto/buty.png" }
    ],
    dostawy: [
      { id_wysylki: "WZ-2026-06-DEMO1", data_wysylki: "11.06.2026", kurier: "DPD", nr_listu: "DPD9988776655", status: "Dostarczona", pozycje: [{ produkt: "Spodnie Motion", nr: "MOT-TRS-001", ilosc: 2 }, { produkt: "Buty ochronne S3", nr: "BUT-002", ilosc: 1 }] }
    ]
  }
];

window.MOCK_ORDERS = window.DEFAULT_ORDERS;
