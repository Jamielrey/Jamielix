const manifest = {
  id: "org.mioaddon.stremio",
  version: "1.0.0",
  name: "Jamielix",
  description: "Un addon per la visione di film e serie TV con filtri avanzati",
  logo: "https://yourlogo.png",
  background: "https://yourbackground.png",
  contactEmail: "tuo@email.com",

  resources: ["catalog", "meta", "stream"],
  types: ["Jamielix"],

  catalogs: [
    {
      type: "Jamielix",
      id: "movieCatalog",
      name: "Film",
      extra: [
        { name: "skip", isRequired: false },
        {
          name: "Genere",
          isRequired: false,
          options: ["Azione", "Avventura", "Animazione", "Commedia", "Crime", "Documentario", "Dramma", "Famiglia", "Fantasy", "Storia", "Horror", "Musica", "Mistero", "Romance", "Fantascienza", "Televisione Film", "Thriller", "Guerra", "Western"],
        },
        {
          name: "Anno",
          isRequired: false,
          options: ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010"],
        },
        {
          name: "Produzione",
          isRequired: false,
          options: ["Italiana", "Americana"],
        }
      ]
    },
    {
      type: "Jamielix",
      id: "serieCatalog",
      name: "Serie"
    }
  ],

  behaviorHints: {
    adult: false,
    p2p: false,
    configurable: false,
    congregated: false
  }
};

module.exports = manifest;
