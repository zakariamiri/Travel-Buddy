export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

      {/* Active Trip */}
      <div className="bg-[#EBD5C8] rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.02] transition">
        <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full w-fit font-semibold">
          ACTIVE TRIP
        </span>

        <h3 className="text-lg font-semibold mt-2">
          Amalfi Coast Roadtrip
        </h3>

        <p className="text-sm text-gray-600">
          Starting in 4 days • 5 collaborators
        </p>

        <button className="text-[#9f411d] text-sm font-semibold mt-3">
          Open Itinerary  →
        </button>
      </div>

      {/* Money */}
      <div className="bg-[#EBD5C8] rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition">
        <i className="ri-hand-coin-fill text-3xl mb-2 text-[#977109]"></i>

        <h3 className="text-xl font-bold">$1,420</h3>

        <p className="text-sm text-gray-600">
          Pending Split
        </p>
      </div>

      {/* Bookings */}
     {/* Countdown / Next Trip */}
        <div className="bg-[#EBD5C8] rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition">

        <i className="ri-timer-flash-fill text-3xl mb-2 text-[#4A6547]"></i>

        <h3 className="text-xl font-bold">
            4 days
        </h3>

        <p className="text-sm text-gray-600">
            until your next trip
        </p>


        </div>

    </div>
  );
}