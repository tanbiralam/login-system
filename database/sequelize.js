import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: true,
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected via Sequelize");
  } catch (error) {
    console.error("Unable to connect:", error);
  }
};
