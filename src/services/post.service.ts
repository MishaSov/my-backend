import { PrismaClient, Prisma, Post, User } from '@prisma/client';

const prisma = new PrismaClient();

export const excludedPostFields = [
  // Здесь можно указать поля, которые нужно исключить при некоторых операциях
];

// Создание поста
export const createPost = async (input: Prisma.PostCreateInput, user: User) => {
  return (await prisma.post.create({
    data: {
      ...input,
      author: {
        connect: { id: user.id }
      }
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          photo: true
          // Исключаем чувствительные данные
        }
      }
    }
  })) as Post;
};

// Получение одного поста
export const findPost = async (
  postId: string,
  select?: Prisma.PostSelect
) => {
  return await prisma.post.findFirst({
    where: { id: postId },
    select,
  }) as Post;
};

export const findPosts = async (
  where?: Prisma.PostWhereInput,
  select?: Prisma.PostSelect,
  include?: Prisma.PostInclude,
  orderBy?: Prisma.PostOrderByWithRelationInput,
  skip?: number,
  take?: number
) => {
  return await prisma.post.findMany({
    where,
    select,
    include,
    orderBy,
    skip,
    take,
  }) as Post[];
};


// Удаление поста
export const deletePost = async (where: Prisma.PostWhereUniqueInput) => {
  return await prisma.post.delete({
    where
  });
};

// Обновление поста
export const updatePost = async (
  where: Prisma.PostWhereUniqueInput,
  data: Prisma.PostUpdateInput,
  select?: Prisma.PostSelect
) => {
  return await prisma.post.update({
    where,
    data,
    select,
  }) as Post;
};

// Получение постов конкретного пользователя
export const findUserPosts = async (
  userId: string,
  options?: {
    published?: boolean;
    skip?: number;
    take?: number;
  }
) => {
  const where: Prisma.PostWhereInput = {
    authorId: userId
  };
  
  if (options?.published !== undefined) {
    where.published = options.published;
  }
  
  return await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: options?.skip,
    take: options?.take,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          photo: true
        }
      }
    }
  });
};