import { db } from "./prismaClient";

const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD!;

async function main() {
  try {
    const Roles = await db.role.createMany({
      data: [
        {
          id: "1",
          name: "ADMIN",
          priority: 1,
        },
        {
          id: "3",
          name: "STUDENT",
          priority: 2,
        },
        {
          id: "2",
          name: "TEACHER",
          priority: 3,
        },
      ],
    });

    const findUser = await db.user.findUnique({
      where: {
        email: email,
      },
    });

    if (findUser) {
      console.log("Admin user already exists");
      return;
    }

    const haspass = await Bun.password.hash(password);

    const newUser = await db.user.create({
      data: {
        name: "Admin",
        phone: "1234567890",
        address: "Dhaka",
        email: email,
        image: "https://i.pravatar.cc",
        password: haspass,
        gender: "MALE",
        department: "ADMIN",
        role: {
          connect: {
            id: "1",
          },
        },
      },
    });

    console.log("Admin user created", newUser);
    console.log("Roles created", Roles);
  } catch (error) {
    console.log(error);
  }
}

main();
