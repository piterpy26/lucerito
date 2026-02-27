import { LifeLine } from "react-loading-indicators"

function Carga() {
    return (
        <div className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-[#EDE3DC] backdrop-blur-sm
            px-6
        ">

            <div className="
                flex flex-col items-center justify-center
                gap-4 sm:gap-5 md:gap-6
                w-full max-w-xs sm:max-w-sm
                text-center
            ">

                {/* Spinner responsive */}
                <div className="scale-90 sm:scale-100 md:scale-110 lg:scale-125 transition-transform">
                    <LifeLine color="#F29FB5" size="large" />
                </div>

            </div>
        </div>
    )
}

export default Carga