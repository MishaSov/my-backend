import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Очистка таблиц (осторожно!)
//   await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Создание тестового пользователя
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Regular User',
      password: hashedPassword,
      role: 'USER'
    }
  });

  // Создание тестовых постов
//   await prisma.post.createMany({
//     data: [
//       {
//         title: 'First Post',
//         content: 'This is the first post content.',
//         published: true,
//         authorId: admin.id
//       },
//       {
//         title: 'Second Post',
//         content: 'This is the second post content.',
//         published: false,
//         authorId: user.id
//       }
//     ]
//   });

  console.log('✅ Seeding completed!');
  console.log(`📧 Admin: admin@example.com / password123`);
  console.log(`📧 User: user@example.com / password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });