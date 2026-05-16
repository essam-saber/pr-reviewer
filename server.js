import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

fastify.post("/webhook", async (request, reply) => {
    request.log.info("Received webhook:", {body: request.body});
    return {status: "OK"};
});


try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

