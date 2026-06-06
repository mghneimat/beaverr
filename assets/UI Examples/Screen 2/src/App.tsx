import { useEffect } from "react";
import {
  ArrowLeft,
  Baby,
  BookOpen,
  Music,
  Plus,
  TrendingUp,
} from "lucide-react";

export default function App() {
  return (
    <div>
      <div className="bg-[#EFF4FB] text-[#1E3A5F] w-full h-fit h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <div className="flex flex-col">
          <div className="flex px-5 pt-4 flex-row justify-between items-center h-14">
            <button className="flex flex-row items-center gap-1">
              <ArrowLeft className="size-4 text-[#6B7A99]" />
              <span className="font-normal text-[#6B7A99] text-base leading-6">
                Back
              </span>
            </button>
            <span className="font-semibold uppercase text-blue-600 text-xs leading-4 tracking-widest">
              CHILDREN
            </span>
            <div className="w-16" />
          </div>
          <div className="px-5 pb-1">
            <div className="rounded-full bg-[#D1DCF0] w-full h-[3px] overflow-hidden">
              <div className="w-[50%] rounded-full bg-[#1E3A5F] h-full" />
            </div>
            <div className="flex mt-2 flex-row justify-center items-center">
              <div className="rounded-full bg-blue-600/10 flex px-2 py-0.5 flex-row items-center gap-1">
                <TrendingUp className="size-3 text-blue-600" />
                <span className="font-semibold text-blue-600 text-[10px] leading-4">
                  50% complete
                </span>
              </div>
            </div>
          </div>
          <div className="flex px-5 pt-3 pb-40 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-bold text-[#1E3A5F] text-2xl leading-8">
                Children's Costs
              </h1>
              <p className="text-[#6B7A99] text-sm leading-[21px]">
                Child-related expenses vary widely. We've pre-filled common
                costs — confirm or adjust to match your situation.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-[10px] bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex p-4 flex-col gap-3">
                <div className="flex flex-row items-center gap-2">
                  <Baby className="size-4 text-blue-600" />
                  <span className="font-semibold text-[#1E3A5F] text-[15px]">
                    Childcare / Daycare
                  </span>
                </div>
                <div className="border-[#D1DCF0] border-t-0 border-r-0 border-b-1 border-l-0 border-solid flex pb-2 flex-row items-end gap-1">
                  <span className="font-semibold text-[#6B7A99] text-lg leading-7">
                    $
                  </span>
                  <span className="leading-none font-bold text-[#1E3A5F] text-[28px]">
                    320
                  </span>
                  <span className="text-[#6B7A99] text-sm leading-5 mb-1">
                    /week
                  </span>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex py-1.5 justify-center items-center flex-1">
                    <span className="text-[#6B7A99] text-xs leading-4">
                      Annual
                    </span>
                  </div>
                  <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex py-1.5 justify-center items-center flex-1">
                    <span className="text-[#6B7A99] text-xs leading-4">
                      Monthly
                    </span>
                  </div>
                  <div className="rounded-full bg-[#1E3A5F] flex py-1.5 justify-center items-center flex-1">
                    <span className="font-semibold text-white text-xs leading-4">
                      Weekly
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-[10px] bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex p-4 flex-col gap-3">
                <div className="flex flex-row items-center gap-2">
                  <BookOpen className="size-4 text-blue-600" />
                  <span className="font-semibold text-[#1E3A5F] text-[15px]">{`School Fees & Supplies`}</span>
                </div>
                <div className="border-[#D1DCF0] border-t-0 border-r-0 border-b-1 border-l-0 border-solid flex pb-2 flex-row items-end gap-1">
                  <span className="font-semibold text-[#6B7A99] text-lg leading-7">
                    $
                  </span>
                  <span className="leading-none font-bold text-[#1E3A5F] text-[28px]">
                    2,400
                  </span>
                  <span className="text-[#6B7A99] text-sm leading-5 mb-1">
                    /year
                  </span>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="rounded-full bg-[#1E3A5F] flex py-1.5 justify-center items-center flex-1">
                    <span className="font-semibold text-white text-xs leading-4">
                      Annual
                    </span>
                  </div>
                  <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex py-1.5 justify-center items-center flex-1">
                    <span className="text-[#6B7A99] text-xs leading-4">
                      Monthly
                    </span>
                  </div>
                  <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex py-1.5 justify-center items-center flex-1">
                    <span className="text-[#6B7A99] text-xs leading-4">
                      Weekly
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-[10px] bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex p-4 flex-col gap-3">
                <div className="flex flex-row items-center gap-2">
                  <Music className="size-4 text-blue-600" />
                  <span className="font-semibold text-[#1E3A5F] text-[15px]">
                    Extracurricular Activities
                  </span>
                </div>
                <div className="border-[#D1DCF0] border-t-0 border-r-0 border-b-1 border-l-0 border-solid flex pb-2 flex-row items-end gap-1">
                  <span className="font-semibold text-[#6B7A99] text-lg leading-7">
                    $
                  </span>
                  <span className="leading-none font-bold text-[#1E3A5F] text-[28px]">
                    1,800
                  </span>
                  <span className="text-[#6B7A99] text-sm leading-5 mb-1">
                    /year
                  </span>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="rounded-full bg-[#1E3A5F] flex py-1.5 justify-center items-center flex-1">
                    <span className="font-semibold text-white text-xs leading-4">
                      Annual
                    </span>
                  </div>
                  <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex py-1.5 justify-center items-center flex-1">
                    <span className="text-[#6B7A99] text-xs leading-4">
                      Monthly
                    </span>
                  </div>
                  <div className="rounded-full bg-[#EFF4FB] border-[#D1DCF0] border-1 border-solid flex py-1.5 justify-center items-center flex-1">
                    <span className="text-[#6B7A99] text-xs leading-4">
                      Weekly
                    </span>
                  </div>
                </div>
              </div>
              <button className="rounded-[10px] border-blue-600 border-2 border-dashed flex py-4 flex-row justify-center items-center gap-2 w-full">
                <Plus className="size-4 text-blue-600" />
                <span className="font-semibold text-blue-600 text-[15px]">
                  Add another children's cost
                </span>
              </button>
            </div>
          </div>
          <div className="fixed bg-[#EFF4FB] border-[#D1DCF0] border-t-1 border-r-0 border-b-0 border-l-0 border-solid inset-x-0 bottom-0 px-5 pt-4 pb-8">
            <button className="rounded-[10px] bg-blue-600 flex py-4 justify-center items-center w-full">
              <span className="font-semibold text-white text-base leading-6">
                Confirm costs
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
