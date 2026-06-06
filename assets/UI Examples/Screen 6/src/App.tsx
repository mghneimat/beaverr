import { useEffect } from "react";
import {
  ArrowLeft,
  Baby,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Home,
  Landmark,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";

export default function App() {
  return (
    <div>
      <div className="bg-[#EFF4FB] text-slate-900 w-full h-fit h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <div className="relative flex flex-col w-full overflow-hidden">
          <div className="flex-shrink-0 flex px-2 flex-row justify-between items-center h-14">
            <div className="flex justify-center items-center w-14 h-14">
              <ArrowLeft className="size-5 text-[#6B7A99]" />
            </div>
            <span className="pointer-events-none font-semibold text-center uppercase text-blue-600 text-base leading-6 tracking-[0.5px] absolute inset-x-0">
              REVIEW
            </span>
            <div className="w-14 h-14" />
          </div>
          <div className="flex-shrink-0 flex px-5 flex-col justify-center gap-1 h-8">
            <div className="rounded-full bg-[#D1DCF0] w-full h-[3px] overflow-hidden">
              <div className="rounded-full bg-[#1E3A5F] w-full h-full" />
            </div>
          </div>
          <div className="flex px-5 pt-1 pb-0 justify-center">
            <span className="inline-flex font-semibold rounded-full bg-[#1E3A5F] text-white text-[10px] tracking-wide px-3 py-1 items-center gap-1">
              <CheckCircle2 className="size-3" />
              100% complete
            </span>
          </div>
          <div className="flex px-8 py-10 flex-col justify-center items-center gap-8">
            <div className="relative flex justify-center items-center">
              <div className="rounded-full bg-blue-100 flex justify-center items-center w-56 h-56">
                <div className="rounded-full bg-blue-200 flex justify-center items-center w-44 h-44">
                  <div className="rounded-full bg-[#1E3A5F] flex justify-center items-center w-32 h-32">
                    <ClipboardCheck className="size-16 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="shadow-lg rounded-full bg-blue-600 flex absolute right-3 top-3 justify-center items-center w-10 h-10">
                <Check className="size-5 text-white" />
              </div>
              <div className="rounded-full bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex absolute left-2 bottom-5 justify-center items-center w-8 h-8">
                <Star className="size-4 text-blue-600" />
              </div>
              <div className="rounded-full bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex absolute left-0 top-8 justify-center items-center w-7 h-7">
                <Sparkles className="size-3 text-[#6B7A99]" />
              </div>
            </div>
            <div className="text-center flex flex-col items-center gap-3">
              <p className="font-bold text-slate-900 text-3xl leading-9">
                Almost Done!
              </p>
              <p className="max-w-[280px] text-[#6B7A99] text-sm leading-6">
                You've filled in all the details. Take a moment to review your
                profile before we finalise everything.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-row gap-3 w-full">
                <div className="rounded-xl bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex px-2 py-3 flex-col items-center flex-1 gap-1">
                  <Home className="size-4 text-blue-600" />
                  <span className="font-medium text-center text-[#6B7A99] text-[10px]">
                    Housing
                  </span>
                </div>
                <div className="rounded-xl bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex px-2 py-3 flex-col items-center flex-1 gap-1">
                  <Users className="size-4 text-blue-600" />
                  <span className="font-medium text-center text-[#6B7A99] text-[10px]">
                    Household
                  </span>
                </div>
                <div className="rounded-xl bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex px-2 py-3 flex-col items-center flex-1 gap-1">
                  <Landmark className="size-4 text-blue-600" />
                  <span className="font-medium text-center text-[#6B7A99] text-[10px]">
                    Charges
                  </span>
                </div>
                <div className="rounded-xl bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex px-2 py-3 flex-col items-center flex-1 gap-1">
                  <Baby className="size-4 text-blue-600" />
                  <span className="font-medium text-center text-[#6B7A99] text-[10px]">
                    Children
                  </span>
                </div>
                <div className="rounded-xl bg-[#F8FAFF] border-[#D1DCF0] border-1 border-solid flex px-2 py-3 flex-col items-center flex-1 gap-1">
                  <Wallet className="size-4 text-blue-600" />
                  <span className="font-medium text-center text-[#6B7A99] text-[10px]">
                    Income
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#EFF4FB] border-[#D1DCF0] border-t-1 border-r-0 border-b-0 border-l-0 border-solid flex px-5 pt-4 pb-8 flex-col gap-3">
            <button className="font-semibold text-center rounded-xl bg-blue-600 text-white text-base leading-6 py-4 w-full">
              Review my profile
            </button>
            <p className="text-center text-[#6B7A99] text-sm leading-5">
              I'll finish this later
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
