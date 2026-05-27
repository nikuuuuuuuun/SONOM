const { DataSource } = require("typeorm")
const { Medusa } = require("@medusajs/medusa")
const path = require("path")

const categoryData = [
  {
    name: "Precolombinas",
    handle: "precolombinas",
    description: "Figuras inspiradas en culturas precolombinas",
  },
  {
    name: "Virreinales",
    handle: "virreinales",
    description: "Artesanias de la epoca virreinal",
  },
  {
    name: "Independencia",
    handle: "independencia",
    description: "Figuras de heroes de la independencia",
  },
  {
    name: "Revolucionarias",
    handle: "revolucionarias",
    description: "Personajes de la revolucion mexicana",
  },
  {
    name: "Artistas Plasticos",
    handle: "artistas-plasticos",
    description: "Figuras de grandes artistas plasticos",
  },
  {
    name: "Escritores",
    handle: "escritores",
    description: "Figuras de escritores y poetas celebres",
  },
  {
    name: "Musica y Danza",
    handle: "musica-danza",
    description: "Figuras de musicos y bailarines iconicos",
  },
  {
    name: "Cine y Television",
    handle: "cine-tv",
    description: "Figuras de estrellas del cine y la television",
  },
  {
    name: "Mitologia y Leyendas",
    handle: "mitologia-leyendas",
    description: "Figuras mitologicas y legendarias",
  },
  {
    name: "Ciencia y Conocimiento",
    handle: "ciencia-conocimiento",
    description: "Figuras de cientificos y pensadores",
  },
]

const productData = [
  {
    title: "Figura de la Diosa Coatlicue",
    subtitle: "Escultura precolombina en barro",
    description: "Artesania elaborada a mano que representa a Coatlicue, la diosa mexica de la tierra y la fertilidad. Pieza unica con acabados tradicionales.",
    handle: "diosa-coatlicue",
    weight: 500,
    height: 25,
    width: 12,
    length: 12,
    categories: ["precolombinas"],
    prices: [
      { currency_code: "mxn", amount: 850 },
      { currency_code: "usd", amount: 45 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (25cm)", "Grande (35cm)"] },
    ],
    images: ["https://placehold.co/600x600/8B4513/FFF?text=Coatlicue"],
  },
  {
    title: "Figura de Frida Kahlo",
    subtitle: "Artesania colorida pintada a mano",
    description: "Figura artesanal de Frida Kahlo con su caracteristico vestido tradicional oaxaqueno y corona de flores. Hecha con tecnicas de alfareria tradicional.",
    handle: "frida-kahlo",
    weight: 350,
    height: 20,
    width: 10,
    length: 10,
    categories: ["artistas-plasticos"],
    prices: [
      { currency_code: "mxn", amount: 680 },
      { currency_code: "usd", amount: 36 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (20cm)", "Grande (30cm)"] },
    ],
    images: ["https://placehold.co/600x600/FF69B4/FFF?text=Frida+Kahlo"],
  },
  {
    title: "Figura de Emiliano Zapata",
    subtitle: "Heroe de la revolucion en barro",
    description: "Artesania que captura la esencia del Caudillo del Sur, Emiliano Zapata. Elaborada con barro natural y detalles en pintura acrilica.",
    handle: "emiliano-zapata",
    weight: 450,
    height: 22,
    width: 11,
    length: 11,
    categories: ["revolucionarias"],
    prices: [
      { currency_code: "mxn", amount: 720 },
      { currency_code: "usd", amount: 38 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (22cm)", "Grande (32cm)"] },
    ],
    images: ["https://placehold.co/600x600/8B0000/FFF?text=Emiliano+Zapata"],
  },
  {
    title: "Figura de Sor Juana Ines de la Cruz",
    subtitle: "Escultura literaria en ceramica",
    description: "Bella representacion de Sor Juana Ines de la Cruz, la poetisa y filosofa novohispana. Pieza de ceramica vidriada con detalles en pan de oro.",
    handle: "sor-juana-ines",
    weight: 400,
    height: 20,
    width: 10,
    length: 10,
    categories: ["escritores", "virreinales"],
    prices: [
      { currency_code: "mxn", amount: 780 },
      { currency_code: "usd", amount: 41 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (20cm)", "Grande (30cm)"] },
    ],
    images: ["https://placehold.co/600x600/4A0080/FFF?text=Sor+Juana"],
  },
  {
    title: "Figura del Che Guevara",
    subtitle: "Icono revolucionario en barro",
    description: "Figura artesanal del Che Guevara con su clasico atuendo de guerrillero. Pieza elaborada a mano con barro rojo de Oaxaca.",
    handle: "che-guevara",
    weight: 380,
    height: 20,
    width: 10,
    length: 10,
    categories: ["revolucionarias"],
    prices: [
      { currency_code: "mxn", amount: 650 },
      { currency_code: "usd", amount: 34 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (20cm)", "Grande (30cm)"] },
    ],
    images: ["https://placehold.co/600x600/2E8B57/FFF?text=Che+Guevara"],
  },
  {
    title: "Figura de Diego Rivera",
    subtitle: "Muralista en miniatura",
    description: "Miniatura artesanal de Diego Rivera con su paleta de pintor. Hecha con tecnicas tradicionales de cartoneria y papel mache.",
    handle: "diego-rivera",
    weight: 250,
    height: 18,
    width: 9,
    length: 9,
    categories: ["artistas-plasticos"],
    prices: [
      { currency_code: "mxn", amount: 580 },
      { currency_code: "usd", amount: 31 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (18cm)"] },
    ],
    images: ["https://placehold.co/600x600/4682B4/FFF?text=Diego+Rivera"],
  },
  {
    title: "Figura de La Llorona",
    subtitle: "Leyenda mexicana en ceramica",
    description: "Artesania que representa a La Llorona, una de las leyendas mas populares de Mexico. Figura de ceramica con acabado antiguo y detalles de pintura a mano.",
    handle: "la-llorona",
    weight: 420,
    height: 22,
    width: 11,
    length: 11,
    categories: ["mitologia-leyendas"],
    prices: [
      { currency_code: "mxn", amount: 700 },
      { currency_code: "usd", amount: 37 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (22cm)"] },
    ],
    images: ["https://placehold.co/600x600/2F4F4F/FFF?text=La+Llorona"],
  },
  {
    title: "Figura de Miguel Hidalgo",
    subtitle: "Padre de la Patria en barro",
    description: "Figura del cura Miguel Hidalgo y Costilla con el estandarte de la Virgen de Guadalupe. Pieza de barro policromado hecha a mano.",
    handle: "miguel-hidalgo",
    weight: 500,
    height: 25,
    width: 12,
    length: 12,
    categories: ["independencia"],
    prices: [
      { currency_code: "mxn", amount: 820 },
      { currency_code: "usd", amount: 43 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (25cm)", "Grande (35cm)"] },
    ],
    images: ["https://placehold.co/600x600/006400/FFF?text=Miguel+Hidalgo"],
  },
  {
    title: "Figura de Octavio Paz",
    subtitle: "Premio Nobel en miniatura",
    description: "Figura del poeta y ensayista Octavio Paz, Premio Nobel de Literatura 1990. Elaborada en barro con detalles en tinta negra.",
    handle: "octavio-paz",
    weight: 300,
    height: 18,
    width: 9,
    length: 9,
    categories: ["escritores"],
    prices: [
      { currency_code: "mxn", amount: 620 },
      { currency_code: "usd", amount: 33 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (18cm)"] },
    ],
    images: ["https://placehold.co/600x600/333333/FFF?text=Octavio+Paz"],
  },
  {
    title: "Figura de Quetzalcoatl",
    subtitle: "Serpiente emplumada en barro",
    description: "Espectacular figura de Quetzalcoatl, la serpiente emplumada, deidad principal de las culturas prehispanicas. Arte en barro con incrustaciones de piedras semipreciosas.",
    handle: "quetzalcoatl",
    weight: 650,
    height: 30,
    width: 15,
    length: 20,
    categories: ["precolombinas", "mitologia-leyendas"],
    prices: [
      { currency_code: "mxn", amount: 1200 },
      { currency_code: "usd", amount: 63 },
    ],
    options: [
      { title: "Tamano", values: ["Mediano (20cm)", "Grande (30cm)", "Extra (45cm)"] },
    ],
    images: ["https://placehold.co/600x600/228B22/FFF?text=Quetzalcoatl"],
  },
  {
    title: "Figura de Juan Rulfo",
    subtitle: "Narrador del Llano en llamas",
    description: "Figura del escritor Juan Rulfo, autor de Pedro Paramo y El Llano en llamas. Pieza de ceramica con textura de libro abierto.",
    handle: "juan-rulfo",
    weight: 280,
    height: 17,
    width: 9,
    length: 9,
    categories: ["escritores"],
    prices: [
      { currency_code: "mxn", amount: 590 },
      { currency_code: "usd", amount: 31 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (17cm)"] },
    ],
    images: ["https://placehold.co/600x600/8B4513/FFF?text=Juan+Rulfo"],
  },
  {
    title: "Figura de Jose Clemente Orozco",
    subtitle: "Muralista en accion",
    description: "Figura del gran muralista jalisciense Jose Clemente Orozco. Hecha en cantera labrada a mano con detalles de pintura al oleo.",
    handle: "jose-clemente-orozco",
    weight: 450,
    height: 22,
    width: 11,
    length: 11,
    categories: ["artistas-plasticos"],
    prices: [
      { currency_code: "mxn", amount: 750 },
      { currency_code: "usd", amount: 40 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (22cm)", "Grande (30cm)"] },
    ],
    images: ["https://placehold.co/600x600/8B0000/FFF?text=Jose+Clemente+Orozco"],
  },
  {
    title: "Figura de Benito Juarez",
    subtitle: "Benemerito de las Americas",
    description: "Figura artesanal de Don Benito Juarez, el presidente indigena mas celebre de Mexico. Elaborada en barro negro de Oaxaca.",
    handle: "benito-juarez",
    weight: 400,
    height: 20,
    width: 10,
    length: 10,
    categories: ["independencia"],
    prices: [
      { currency_code: "mxn", amount: 680 },
      { currency_code: "usd", amount: 36 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (20cm)", "Grande (28cm)"] },
    ],
    images: ["https://placehold.co/600x600/1a1a2e/FFF?text=Benito+Juarez"],
  },
  {
    title: "Figura de Maria Sabina",
    subtitle: "Sabia Mazateca en ceramica",
    description: "Figura de la curandera y poeta mazateca Maria Sabina. Ceramica policromada con simbolos tradicionales mazatecos pintados a mano.",
    handle: "maria-sabina",
    weight: 320,
    height: 18,
    width: 9,
    length: 9,
    categories: ["ciencia-conocimiento"],
    prices: [
      { currency_code: "mxn", amount: 640 },
      { currency_code: "usd", amount: 34 },
    ],
    options: [
      { title: "Tamano", values: ["Chico (15cm)", "Mediano (18cm)"] },
    ],
    images: ["https://placehold.co/600x600/DDA0DD/FFF?text=Maria+Sabina"],
  },
  {
    title: "Figura de la Catrina",
    subtitle: "Icono de Dia de Muertos",
    description: "Elegante figura de la Catrina, el icono creado por Jose Guadalupe Posada. Hecha en barro vidriado con sombrero de plumas y vestido ornamentado.",
    handle: "catrina",
    weight: 500,
    height: 28,
    width: 14,
    length: 14,
    categories: ["artistas-plasticos", "mitologia-leyendas"],
    prices: [
      { currency_code: "mxn", amount: 950 },
      { currency_code: "usd", amount: 50 },
    ],
    options: [
      { title: "Tamano", values: ["Mediano (20cm)", "Grande (28cm)", "Extra (40cm)"] },
    ],
    images: ["https://placehold.co/600x600/FF4500/FFF?text=La+Catrina"],
  },
]

async function seed() {
  try {
    const { ctrl } = await Medusa.start({
      directory: path.resolve(__dirname, ".."),
      expressSession: {
        resave: false,
        saveUninitialized: true,
        secret: process.env.COOKIE_SECRET || "supersecret",
      },
    })

    const dataSource = ctrl.dataSource
    const manager = dataSource.manager

    for (const cat of categoryData) {
      const existing = await manager.query(
        `SELECT * FROM product_category WHERE handle = $1`,
        [cat.handle]
      )
      if (existing.length === 0) {
        await manager.query(
          `INSERT INTO product_category (name, handle, description, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [cat.name, cat.handle, cat.description]
        )
        console.log(`Created category: ${cat.name}`)
      }
    }

    console.log("Seed completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Seed failed:", error)
    process.exit(1)
  }
}

seed()
