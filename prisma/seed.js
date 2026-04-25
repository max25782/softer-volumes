const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const seoul = await prisma.guide.upsert({
    where: { slug: 'seoul' },
    update: {},
    create: {
      slug: 'seoul',
      title: 'Seoul',
      subtitle: 'City Guide',
      tagline: '서울',
      description:
        'The city that never sleeps — and never stops surprising. From hidden hanok cafes to rooftop cocktail bars with views of Namsan Tower.',
      coverImage:
        'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=800&q=80',
      heroImage:
        'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1600&q=80',
      price: 10000,
      currency: 'usd',
      isPublished: true,
    },
  })

  const cafe = await prisma.place.upsert({
    where: { id: 'seed-place-cafe-onion' },
    update: {},
    create: {
      id: 'seed-place-cafe-onion',
      guideId: seoul.id,
      name: 'Cafe Onion Anguk',
      description:
        'A converted hanok bakery and cafe with layered pastries, courtyard light, and a strong sense of place.',
      personalNote:
        'Go early on a weekday, order the pandoro, and sit where you can see the old roofline.',
      category: 'cafe',
      district: 'Anguk',
      address: '5 Gyedong-gil, Jongno-gu, Seoul',
      lat: 37.5794,
      lng: 126.9869,
      priceRange: 2,
      instagramUrl: 'https://www.instagram.com/cafe.onion',
      isFeatured: true,
      isPublished: true,
    },
  })

  await prisma.placePhoto.upsert({
    where: { id: 'seed-photo-cafe-onion-1' },
    update: {},
    create: {
      id: 'seed-photo-cafe-onion-1',
      placeId: cafe.id,
      url: 'https://images.unsplash.com/photo-1586079425904-4cb1e0f07ff1?w=600&q=80',
      s3Key: 'guides/seoul/places/seed-place-cafe-onion/seed-photo-cafe-onion-1.webp',
      alt: 'Cafe Onion Anguk interior',
      width: 600,
      height: 400,
      sortOrder: 0,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
