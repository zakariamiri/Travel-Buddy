type TripCardProps = {
  title: string;
  date: string;
  image: string;
  status: "CONFIRMED" | "PLANNING" | "PAST";
};

export default function TripCard({ title, date, image, status }: TripCardProps) {
  const statusStyle = {
    CONFIRMED: "bg-green-100 text-green-700",
    PLANNING: "bg-orange-100 text-orange-700",
    PAST: "bg-gray-200 text-gray-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition overflow-hidden cursor-pointer h-90">

      <div className="relative">
        <img src={image} className="h-44 w-full object-cover" />

        <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full shadow ${statusStyle[status]}`}>
          {status}
        </span>
        
      </div>

      <div className="p-4 relative">
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{date}</p>

        <button className="absolute top-3 right-3 backdrop-blur p-1.5 ">
            <i className="ri-more-2-fill text-gray-600 text-lg"></i>
        </button>

        <div className="flex items-center justify-between mt-13">
          <div className="flex -space-x-2">
            <img className="w-7 h-7 rounded-full border-2 border-white" src="https://i.pravatar.cc/40?img=1"/>
            <img className="w-7 h-7 rounded-full border-2 border-white" src="https://i.pravatar.cc/40?img=2"/>
          </div>

          <button className="text-[#9f411d]">
            <i className="ri-share-line text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}