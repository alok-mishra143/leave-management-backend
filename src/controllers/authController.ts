import type { Request, Response } from 'express';
import { loginValidation } from '../validations/authValidation';
import { db } from '../db/prismaClient';


export const loginUser=async(req: Request, res: Response):Promise<void>=> {
    try {

        const validation=loginValidation.safeParse(req.body);
        if(!validation.success){
            res.status(400).json({message:validation.error.errors});
            return;
        }
        const {email,password}=validation.data;

        const existingUser=await db.user.findUnique({
            where:{
                email
            },
            select:{
                id:true,
                email:true,
            name:true,
        role:true,}
        })

        if(!existingUser){
            res.status(404).json({message:"User not found"});
            return;
        }

        const isPasswordValid=Bun.password.verify(existingUser.password,password);

        if(!isPasswordValid){
            res.status(401).json({message:"Invalid password"});
            return;
        }



        
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
        
    }
}