import { useEffect } from "react";
import { ArrowLeft, Building2, Droplets, Landmark, Plus } from "lucide-react";

export default function App() {
  return (
    <div>
      <div className="bg-[#EFF4FB] text-neutral-950 w-full h-fit h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <div className="relative flex flex-col w-full overflow-hidden">
          <div className="relative flex-shrink-0 bg-[#EFF4FB] flex flex-row items-center w-full h-14">
            <div className="flex justify-center items-center w-14 h-14">
              <ArrowLeft className="text-[#6B7A99]" size={16} />
            </div>
            <div className="pointer-events-none flex absolute inset-0 justify-center items-center">
              <span className="font-normal uppercase text-blue-600 text-base leading-6 tracking-[0.5px]">
                Government
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 bg-[#D1DCF0] w-full h-[3px]">
            <div className="w-[35%] rounded-full bg-[#1E3A5F] h-full" />
          </div>
          <div className="overflow-y-auto flex px-5 pt-6 pb-32 flex-col flex-1 gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[#1A1A1A] text-2xl leading-8">{`Government & City Charges`}</span>
              <span className="text-[#6B7A99] text-[15px] leading-[22px]">
                Most households pay fixed statutory charges. We've pre-filled
                the most common ones — confirm or adjust.
              </span>
            </div>
            <div className="rounded-[10px] bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex p-4 flex-col gap-4">
              <div className="flex flex-row items-center gap-2">
                <div className="rounded-lg bg-blue-600/10 flex justify-center items-center w-8 h-8">
                  <Building2 size={16} className="text-blue-600" />
                </div>
                <span className="font-semibold text-[#1A1A1A] text-sm leading-5">
                  Council Rates
                </span>
              </div>
              <div className="rounded-[10px] bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex px-4 py-3 flex-row items-center gap-2">
                <span className="font-medium text-[#6B7A99] text-base leading-6">
                  $
                </span>
                <span className="font-bold text-[#1A1A1A] text-2xl leading-8 border-[#D1DCF0] border-t-0 border-r-0 border-b-1 border-l-0 border-solid pb-1 flex-1">
                  890
                </span>
                <span className="font-medium text-[#6B7A99] text-xs leading-4">
                  /year
                </span>
              </div>
              <div className="flex flex-row flex-wrap gap-2">
                <div className="rounded-full bg-[#1E3A5F] px-4 py-2">
                  <span className="font-medium text-white text-sm leading-5">
                    Annual
                  </span>
                </div>
                <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid px-4 py-2">
                  <span className="font-medium text-[#1A1A1A] text-sm leading-5">
                    Quarterly
                  </span>
                </div>
                <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid px-4 py-2">
                  <span className="font-medium text-[#1A1A1A] text-sm leading-5">
                    Monthly
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-[10px] bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex p-4 flex-col gap-4">
              <div className="flex flex-row items-center gap-2">
                <div className="rounded-lg bg-blue-600/10 flex justify-center items-center w-8 h-8">
                  <Droplets size={16} className="text-blue-600" />
                </div>
                <span className="font-semibold text-[#1A1A1A] text-sm leading-5">{`Water & Sewerage Levy`}</span>
              </div>
              <div className="rounded-[10px] bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex px-4 py-3 flex-row items-center gap-2">
                <span className="font-medium text-[#6B7A99] text-base leading-6">
                  $
                </span>
                <span className="font-bold text-[#1A1A1A] text-2xl leading-8 border-[#D1DCF0] border-t-0 border-r-0 border-b-1 border-l-0 border-solid pb-1 flex-1">
                  340
                </span>
                <span className="font-medium text-[#6B7A99] text-xs leading-4">
                  /year
                </span>
              </div>
              <div className="flex flex-row flex-wrap gap-2">
                <div className="rounded-full bg-[#1E3A5F] px-4 py-2">
                  <span className="font-medium text-white text-sm leading-5">
                    Annual
                  </span>
                </div>
                <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid px-4 py-2">
                  <span className="font-medium text-[#1A1A1A] text-sm leading-5">
                    Quarterly
                  </span>
                </div>
                <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid px-4 py-2">
                  <span className="font-medium text-[#1A1A1A] text-sm leading-5">
                    Monthly
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-[10px] bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex p-4 flex-col gap-4">
              <div className="flex flex-row items-center gap-2">
                <div className="rounded-lg bg-blue-600/10 flex justify-center items-center w-8 h-8">
                  <Landmark size={16} className="text-blue-600" />
                </div>
                <span className="font-semibold text-[#1A1A1A] text-sm leading-5">
                  Land Tax / Stamp Duty
                </span>
              </div>
              <div className="rounded-[10px] bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex px-4 py-3 flex-row items-center gap-2">
                <span className="font-medium text-[#6B7A99] text-base leading-6">
                  $
                </span>
                <span className="font-bold text-[#1A1A1A] text-2xl leading-8 border-[#D1DCF0] border-t-0 border-r-0 border-b-1 border-l-0 border-solid pb-1 flex-1">
                  1,240
                </span>
                <span className="font-medium text-[#6B7A99] text-xs leading-4">
                  /year
                </span>
              </div>
              <div className="flex flex-row flex-wrap gap-2">
                <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid px-4 py-2">
                  <span className="font-medium text-[#1A1A1A] text-sm leading-5">
                    Annual
                  </span>
                </div>
                <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid px-4 py-2">
                  <span className="font-medium text-[#1A1A1A] text-sm leading-5">
                    Quarterly
                  </span>
                </div>
                <div className="rounded-full bg-[#1E3A5F] px-4 py-2">
                  <span className="font-medium text-white text-sm leading-5">
                    Monthly
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-[10px] border-blue-600 border-1 border-dashed flex py-3 flex-row justify-center items-center gap-2">
              <Plus className="text-blue-600" size={16} />
              <span className="font-medium text-blue-600 text-sm leading-5">
                Add another charge
              </span>
            </div>
          </div>
          <div className="bg-[#EFF4FB] border-[#D1DCF0] border-t-1 border-r-0 border-b-0 border-l-0 border-solid flex absolute inset-x-0 bottom-0 px-5 pt-3 pb-8">
            <div className="rounded-[10px] bg-blue-600 flex py-4 justify-center items-center w-full">
              <span className="font-semibold text-white text-base leading-6">
                Confirm charges
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
