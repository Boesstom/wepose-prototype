export const MOCK_DOCUMENTS = [
  {
    id: "1",
    name: "Passport Cover",
    formats: ["JPG", "PNG"],
    allowMultiple: false,
    subDocuments: [],
    usedIn: ["Tourist Visa", "Business Visa"],
  },
  {
    id: "2",
    name: "Bank Statement",
    formats: ["PDF"],
    allowMultiple: true,
    subDocuments: [],
    usedIn: ["Business Visa", "Student Visa"],
  },
  {
    id: "3",
    name: "Tax Return",
    formats: ["PDF"],
    allowMultiple: false,
    subDocuments: ["Year 2023", "Year 2024", "Year 2025"],
    usedIn: ["Business Visa"],
  },
  {
      id: "4",
      name: "Birth Certificate",
      formats: ["JPG", "PDF"],
      allowMultiple: false,
      subDocuments: [],
      usedIn: ["Family Update"],
  }
];
