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
          id: "2",
          name: "HOD",
          priority: 2,
        },
        {
          id: "3",
          name: "STAFF",
          priority: 3,
        },
        {
          id: "4",
          name: "STUDENT",
          priority: 4,
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
        provider: "Credentials",
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
