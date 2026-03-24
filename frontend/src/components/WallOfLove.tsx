export default function WallOfLove() {
  return (
    <section className="border-t border-[#2A2A30] py-20">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="text-center text-[28px] font-medium text-white">
          Loved by indie hackers
        </h2>
        <p className="mt-2 text-center text-sm text-[#8B8B92] mb-10">
          See what builders are saying about ShipProof
        </p>
        <iframe
          id="shipproof-wall-first-wall-e9e4d4"
          src="https://shipproof.io/embed-wall/first-wall-e9e4d4"
          frameBorder="0"
          scrolling="no"
          width="100%"
          style={{ border: "none", borderRadius: "12px", minHeight: "600px" }}
          loading="lazy"
        />
        <script
          type="text/javascript"
          src="https://shipproof.io/js/embed.js"
          async
        />
      </div>
    </section>
  );
}
