const TILES = [
  {
    name: "Elon Musk",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/330px-Elon_Musk_-_54820081119_%28cropped%29.jpg",
  },
  {
    name: "Taylor Swift",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/330px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png",
  },
  {
    name: "Conor McGregor",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Conor_McGregor_2025.jpeg/330px-Conor_McGregor_2025.jpeg",
  },
  {
    name: "Barack Obama",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/330px-President_Barack_Obama.jpg",
  },
  {
    name: "Donald Trump",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29.jpg/330px-Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29.jpg",
  },
  {
    name: "Michael Jackson",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/330px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg",
  },
  {
    name: "Floyd Mayweather",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Floyd_Mayweather_Jr_2011.jpg/330px-Floyd_Mayweather_Jr_2011.jpg",
  },
  {
    name: "Dana White",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Ilham_Aliyev_received_Dana_White%2C_June_2025_%283x4_cropped_and_rotated_on_White%29.jpg/330px-Ilham_Aliyev_received_Dana_White%2C_June_2025_%283x4_cropped_and_rotated_on_White%29.jpg",
  },
  {
    name: "Jimmy Fallon",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Jimmy_Fallon-TTL_4575_%2811046141004%29_%285x7_cropped_and_rotated%29.jpg/330px-Jimmy_Fallon-TTL_4575_%2811046141004%29_%285x7_cropped_and_rotated%29.jpg",
  },
  {
    name: "Ryan Seacrest",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ryan_Seacrest_%282019%29.jpg/330px-Ryan_Seacrest_%282019%29.jpg",
  },
  {
    name: "Ice Bucket Challenge",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Doing_the_ALS_Ice_Bucket_Challenge_%2814927191426%29.jpg/330px-Doing_the_ALS_Ice_Bucket_Challenge_%2814927191426%29.jpg",
  },
  {
    name: "Arsenio Hall",
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Arsenio_Hall_in_2014.jpg/330px-Arsenio_Hall_in_2014.jpg",
  },
] as const;

type Props = {
  className?: string;
  density?: "hero" | "dense";
  animate?: boolean;
};

export function GridMosaic({
  className = "",
  density = "hero",
  animate = true,
}: Props) {
  const tiles = density === "dense" ? [...TILES, ...TILES.slice(0, 6)] : TILES;

  return (
    <div
      className={`grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-1.5 md:grid-cols-6 ${className}`}
      aria-hidden
    >
      {tiles.map((tile, i) => (
        <div
          key={`${tile.name}-${i}`}
          className={`relative aspect-square overflow-hidden bg-neutral-200 ${
            animate ? "nl-mock-tile" : ""
          }`}
          style={animate ? { animationDelay: `${(i % 12) * 90}ms` } : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tile.src}
            alt=""
            className="h-full w-full object-cover"
            loading={i < 6 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}
