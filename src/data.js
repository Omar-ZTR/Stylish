export const barbers = [
  {
    id: "1",
    name: "Tony FadeMaster",
    logo: "https://picsum.photos/id/64/200/200",
    rating: 4.5,
    startTime: "09:00",
    endTime: "19:00",
    distance: "1.5 km",
    location: "Downtown Sousse",
    services: [
      {
        id: "1",
        name: "Classic Haircut",
        duration: "30 min",
        price: "25 TND",
        image: "https://picsum.photos/id/1005/300/400",
      },
      {
        id: "2",
        name: "Beard Trim",
        duration: "20 min",
        price: "15 TND",
        image: "https://picsum.photos/id/1011/300/400",
      },
      {
        id: "3",
        name: "Hair Wash",
        duration: "15 min",
        price: "10 TND",
        image: "https://picsum.photos/id/1027/300/400",
      },
    ],
  },
  {
    id: "2",
    name: "Slim the Stylist",
    logo: "https://picsum.photos/id/1025/200/200",
    rating: 4.2,
    startTime: "10:00",
    endTime: "20:00",
    distance: "1.5 km",
    location: "Corniche, Sousse",
    services: [
      {
        id: "1",
        name: "Modern Fade",
        duration: "40 min",
        price: "30 TND",
        image: "https://picsum.photos/id/1033/300/400",
      },
      {
        id: "2",
        name: "Hot Towel Shave",
        duration: "25 min",
        price: "20 TND",
        image: "https://picsum.photos/id/1040/300/400",
      },
    ],
  },
  {
    id: "3",
    name: "Barber House",
    logo: "https://picsum.photos/id/1021/200/200",
    rating: 5.0,
    startTime: "08:00",
    endTime: "18:00",
    distance: "1.5 km",
    location: "Sahloul, Sousse",
    services: [
      {
        id: "1",
        name: "Kids Cut",
        duration: "25 min",
        price: "18 TND",
        image: "https://picsum.photos/id/1052/300/400",
      },
      {
        id: "2",
        name: "Hair Coloring",
        duration: "60 min",
        price: "50 TND",
        image: "https://picsum.photos/id/1060/300/400",
      },
    ],
  },
];

export const news = [
  {
    id: "n1",
    title: "Fresh fade styles this week",
    excerpt: "New fade techniques and discounts on student cuts.",
    image: "https://picsum.photos/600/400?random=21",
    date: "2 days ago",
    barber: "Tony FadeMaster",
    barberLogo: "https://picsum.photos/id/64/200/200",
  },
  {
    id: "n2",
    title: "Beard-care tips",
    excerpt: "Learn the daily routine to keep your beard sharp.",
    image: "https://picsum.photos/600/400?random=22",
    date: "1 week ago",
    barber: "Slim the Stylist",
    barberLogo: "https://picsum.photos/id/1025/200/200",
  },
  {
    id: "n3",
    title: "Summer style inspo",
    excerpt: "Check out our trending summer looks for 2025.",
    image: "https://picsum.photos/600/400?random=23",
    date: "3 days ago",
    barber: "Barber House",
    barberLogo: "https://picsum.photos/id/1021/200/200",
  },
  {
    id: "n4",
    title: "Hot towel shave masterclass",
    excerpt: "Experience the ultimate relaxation treatment.",
    image: "https://picsum.photos/600/400?random=24",
    date: "5 days ago",
    barber: "Tony FadeMaster",
    barberLogo: "https://picsum.photos/id/64/200/200",
  },
  {
    id: "n5",
    title: "Hair coloring trends",
    excerpt: "Explore the hottest color trends this season.",
    image: "https://picsum.photos/600/400?random=25",
    date: "1 week ago",
    barber: "Slim the Stylist",
    barberLogo: "https://picsum.photos/id/1025/200/200",
  },
];

export const stories = [
  {
    id: "s1",
    title: "Tony",
    image: "https://picsum.photos/id/64/200/200",
    barberLogo: "https://picsum.photos/id/64/200/200",
    viewed: false,
  },
  {
    id: "s2",
    title: "Slim",
    image: "https://picsum.photos/id/1025/200/200",
    barberLogo: "https://picsum.photos/id/1025/200/200",
    viewed: false,
  },
  {
    id: "s3",
    title: "Barber House",
    image: "https://picsum.photos/id/1021/200/200",
    barberLogo: "https://picsum.photos/id/1021/200/200",
    viewed: false,
  },
  {
    id: "s4",
    title: "Your Story",
    image: "https://picsum.photos/600/600?random=99",
    barberLogo: null,
    viewed: false,
  },
];

export const salesPacks = [
  {
    id: "1",
    title: "Gold Groom Pack",
    discount: "Save 25%",
    image:
     "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200",
    description: "Haircut + Beard Trim + Facial Mask",
    price: "$40",
  },
  {
    id: "2",
    title: "Classic Shave Deal",
    discount: "Save 15%",
    image:
     "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200",
    description: "Hot Towel Shave + Skin Care",
    price: "$25",
  },
  {
    id: "3",
    title: "King’s Treatment",
    discount: "Save 30%",
    image:
     "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200",
    description: "Full Haircut + Beard + Massage + Styling",
    price: "$60",
  },
  {
    id: "4",
    title: "Fresh Fade Combo",
    discount: "Save 20%",
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200",
    description: "Fade + Beard Shape + Styling",
    price: "$35",
  },
  {
    id: "5",
    title: "Student Pack",
    discount: "Save 10%",
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200",
    description: "Quick Cut + Light Beard Trim",
    price: "$20",
  },
];
export default function DataRoute() {
  return null;
}