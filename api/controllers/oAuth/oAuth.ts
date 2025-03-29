import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { db } from "../../db/prismaClient";
import { RoleId } from "../../constants/Meassage";
import { Department, Gender, type User } from "@prisma/client";

const clientID = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const callbackURL = process.env.GOOGLE_CALLBACK_URL!;

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails?.length) {
          throw new Error("No email found from Google profile");
        }
        if (!profile.photos?.length) {
          throw new Error("No photo found from Google profile");
        }
        const email = profile.emails[0].value;
        const image = profile.photos[0].value;
        const name = profile.displayName;
        const provider = profile.provider;

        let user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              email,
              name,
              provider: provider,
              password: "",
              image,
              address: "",
              phone: "",
              role: {
                connect: { id: RoleId.STUDENT },
              },
              gender: Gender.MALE,
              department: Department.CSE,
            },
          });

          await db.userLeaveTable.create({
            data: {
              userId: user.id,
              academicYear: new Date().getFullYear().toString(),
            },
          });
        }

        const role = await db.role.findUnique({
          where: { id: user.roleId },
        });
        if (!role) {
          throw new Error("Role not found");
        }

        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
            role: role.name,
            image: user.image,
            name: user.name,
          },
          process.env.JWT_SECRET!,
          { expiresIn: "24h" }
        );

        done(null, { user, token });
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.serializeUser((data, done) => {
  done(null, data);
});

passport.deserializeUser((data: any, done) => {
  done(null, data as false | User | null | undefined);
});
