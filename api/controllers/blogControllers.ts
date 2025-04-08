import { db } from "../db/prismaClient";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { blogValidation } from "../validations/blogValidation";
import { Role } from "../constants/Meassage";

// export const getAllBlogs = async (req: Request, res: Response): Promise<void> => {}

export const createBlogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = blogValidation.safeParse(req.body);
    const { id } = req.user;
    if (!validation.success) {
      res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
      return;
    }
    const { title, content } = validation.data;

    const newBlog = await db.blogs.create({
      data: {
        title,
        content,
        authorId: id,
      },
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllBlogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = "1", limit = "10", search = "" } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Filtering based on search query
    const whereClause = search
      ? {
          OR: [
            {
              title: {
                contains: search as string,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              content: {
                contains: search as string,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {};

    const blogs = await db.blogs.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    const filteredBlogs = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      content: blog.content,
      createdAt: blog.createdAt,
      author: blog.author.name,
    }));

    // Fetching total count for pagination metadata
    const totalBlogs = await db.blogs.count({ where: whereClause });
    const totalPages = Math.ceil(totalBlogs / pageSize);

    res.status(200).json({
      success: true,
      data: filteredBlogs,
      pagination: {
        totalBlogs,
        totalPages,
        currentPage: pageNumber,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const blogExists = await db.blogs.findUnique({
      where: { id },
    });

    if (!blogExists) {
      res.status(404).json({
        success: false,
        message: "Blog not found",
      });
      return;
    }

    const { id: userId, role } = req.user;

    if (role !== Role.ADMIN && blogExists.authorId !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this blog",
      });
      return;
    }

    const blog = await db.blogs.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const validation = blogValidation.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Invalid input",
        details: validation.error.errors,
      });
      return;
    }
    const { title, content } = validation.data;

    const blogExists = await db.blogs.findUnique({
      where: { id },
    });
    if (!blogExists) {
      res.status(404).json({
        success: false,
        message: "Blog not found",
      });
      return;
    }

    // Check if the user is the author of the blog
    const { id: userId } = req.user;
    if (blogExists.authorId !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to update this blog",
      });
      return;
    }

    const updatedBlog = await db.blogs.update({
      where: { id },
      data: { title, content },
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
