import { NextFunction, Request, Response } from 'express';
import {
  CreatePostInput,
  DeletePostInput,
  GetPostInput,
  UpdatePostInput,
} from '../schemas/post.schema';
import {
  createPost,
  findPosts,
  findPost,
  deletePost,
  updatePost,
  findUserPosts
} from '../services/post.service';
import { findUserById } from '../services/user.service';
import AppError from '../utils/appError';


export const createPostHandler = async (
  req: Request<{}, {}, CreatePostInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await findUserById(res.locals.user.id as string);

    const post = await createPost(req.body, user!);

    res.status(201).json({
      status: 'success',
      data: {
        post,
      },
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({
        status: 'fail',
        message: 'Post with that title already exist',
      });
    }
    next(err);
  }
};

export const getPostHandler = async (
  req: Request<GetPostInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const post = await findPost(req.params.postId);

    if (!post) {
      return next(new AppError(404, 'Post with that ID not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        post,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const getPostsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const posts = await findPosts();

    res.status(200).json({
      status: 'success',
      results: posts.length,
      data: {
        posts,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const deletePostHandler = async (
  req: Request<DeletePostInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Проверяем существование поста
    const post = await findPost(req.params.postId);

    if (!post) {
      return next(new AppError(404, 'Post with that ID not found'));
    }

    // Проверяем, имеет ли пользователь право удалить этот пост
    if (post.authorId !== res.locals.user.id) {
      return next(new AppError(403, 'You are not authorized to delete this post'));
    }

    // Удаляем пост
    await deletePost({ id: req.params.postId });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err: any) {
    next(err);
  }
};

export const updatePostHandler = async (
  req: Request<UpdatePostInput['params'], {}, UpdatePostInput['body']>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Проверяем существование поста
    const post = await findPost(req.params.postId);

    if (!post) {
      return next(new AppError(404, 'Post with that ID not found'));
    }

    // Проверяем, имеет ли пользователь право обновить этот пост
    if (post.authorId !== res.locals.user.id) {
      return next(new AppError(403, 'You are not authorized to update this post'));
    }

    // Обновляем пост через сервис
    const updatedPost = await updatePost(
      { id: req.params.postId },
      req.body,
      {
        id: true,
        title: true,
        content: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true
          }
        }
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        post: updatedPost,
      },
    });
  } catch (err: any) {
    next(err);
  }
};

export const parsePostFormData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.data) return next();
    const parsedBody = { ...JSON.parse(req.body.data) };
    if (req.body.image) {
      parsedBody['image'] = req.body.image;
    }

    req.body = parsedBody;
    next();
  } catch (err: any) {
    next(err);
  }
};
