"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface, Sequelize) {
    const password = await bcrypt.hash("password123", 10);
    const [user] = await queryInterface.bulkInsert(
      "Users",
      [
        {
          email: "demo@example.com",
          password,
          name: "Demo User",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { returning: ["id"] }
    );

    const userId = user?.id ?? user; // handle Postgres return shape
    await queryInterface.bulkInsert("Images", [
      {
        filename: "hello.png",
        mimeType: "image/png",
        data: Buffer.from("fake-image-bytes"),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" WHERE email = :email',
      {
        replacements: { email: "demo@example.com" },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    const userIds = users.map((u) => u.id);
    if (userIds.length) {
      await queryInterface.bulkDelete("Images", { userId: userIds });
    }
    await queryInterface.bulkDelete("Users", { email: "demo@example.com" });
  },
};
