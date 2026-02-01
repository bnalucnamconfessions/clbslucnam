'use client'

const SPONSORS_GOLD = [
  {
    name: 'TechEdu Solutions',
    description: 'Đơn vị cung cấp giải pháp công nghệ giáo dục hàng đầu, tài trợ hệ thống quản lý thư viện số và các thiết bị đọc sách điện tử cho thành viên câu lạc bộ.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFeNK03UVhhBhrowYdOBhu3E_JUSgTKvURaPih5t9eUZ-G2HSyhUJgbmpti1g_xl-2N0nGDJF8RgMJLT4KmaPfAcBwrvw4edcFwO9f4tL1V8tfLkdzlWS3on5aYhS_giH5J-b9zpTObzs-1yflSM2P5hxi1HLNLW9-IdA4ROB1760Crl1-ZCIAfI3sMnRvoA-N3y4D9lY8OSKQcuAhy2pK9uPm8rAztj54Qx7CdgH0uvBNrb05Vr9RmmDrCQd17fWIBT7WaMVo5m38',
    icon: 'verified',
  },
  {
    name: 'NXB Tri Thức Trẻ',
    description: 'Đối tác cung cấp nguồn sách bản quyền phong phú, hỗ trợ tổ chức các buổi tọa đàm tác giả và workshop kỹ năng đọc hiểu cho sinh viên.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAixUwENBdTJtrysXw2eh_LMbEtEQZa3ZU2OVUOIMdHa0HpIKl2CccNvfmswBoe5BOEeqo6UK5Hbb19o94EAaqoXDprHLxGqzT9yxHsBrQewsZE8hmWy-6BxoQPf-IdfGI6B6Qt5B7RFDWML9jIxQoRJ6kkbucVxI3-IJDR10TtDqgw5R1SKwUALeBz5JTErC0w4DmVYw726K3AGe-EZzM2iapbfE6iEJMVQDyK9fSX_l01QCeOiRQUgdcIciIVFRAHrDvcoXNz2_J',
    icon: 'school',
  },
]

const PARTNERS_STRATEGIC = [
  { name: 'Innovation Hub', desc: 'Hỗ trợ không gian làm việc nhóm và tổ chức sự kiện chuyên nghiệp cho các dự án của CLB.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqnBdMDqFF36ZHbeOv7NxTVGX8yJ1A_yTuyfASGjoaJ1tmytRJNa8ePT6gZx-QuKjBIPy8C5-tRpF8cqGADjs4qZjgBRGdUjGYmb16Y7F_ouqzW3-3_pOJvzmAVh-8uzBhXPScJByyIeYx7QpJ6NrDgUcm3drGram9FH_MSvNC8a7AIb9EsXoNe_aHecaGi2fhiCp2oTMdTWrUHPSJNuQQeKWwJudr3C-KeLQ-UNgJWkMfvOgAG-TUX4yhvPbn84mCnOyFolc_HN5z' },
  { name: 'Coffee & Books', desc: 'Tài trợ voucher đồ uống và địa điểm cho các buổi offline đọc sách hàng tháng.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEz5ZZObQsNNQXR8gs-BOTaQcowIEJcdnoRY18VON36WW3Bgq3YzvOExscRRz6swDMJA8Or9LGr_VSfYFSldLA8z5rgVlqvhjiZTdiu4uEdXSMwjbobWFYUrujo_Kuqn2LSvw8G7ee_9D_nmeM3jMWDCrDK-3uFGgFy97Md5nMNbwmLgYFii-UXMQZ5i7SAEc4RJUx6pz1S7C9DxQfME6QAFJXnsUxL0m8g0iuwMPAop3HoowjMOlix2txK3X2_NMJ1tXbjtRPzdCd' },
  { name: 'Alpha Stationery', desc: 'Cung cấp văn phòng phẩm và các vật phẩm quà tặng cho các cuộc thi viết.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm8geTdPQunDiVInhI932PTrFJi5FpOvO99fZk_vzh_-cjQCYOfoISC8liLr3XLqJjfNLxfOv_KATKHbAbUX2wCt0FcNTbmUj-oeuBPHwNW-9wn6QDqlE0cJ9m0xlkVsPtBGP8-iGxKwAi_GnuKqjkfDfBQHNwg2W8RaDPs9PkGNLq3_MSxf8xsgDLOP4MonKvKVsgGgxSNZ7rhoVikpTZ04YKzG83VRY9DTBJRRZdWyaum1zaOQTDX8E2hTcXUWuJXOMgZSE6S9Iv' },
]

const PARTNERS_COMMUNITY = [
  { name: 'BookWorm', icon: 'menu_book' },
  { name: 'Global Lang', icon: 'language' },
  { name: 'Art Space', icon: 'palette' },
  { name: 'SciLab', icon: 'science' },
  { name: 'GameZone', icon: 'sports_esports' },
]

export default function DoiTacContent() {
  return (
    <div className="flex flex-col w-full">
      <div className="w-full p-4 md:p-6 lg:px-8 lg:py-8">
        <div className="min-h-[320px] flex flex-col gap-6 md:gap-8 rounded-xl items-center justify-center p-8 relative overflow-hidden bg-slate-800 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(17, 26, 34, 0.85) 0%, rgba(17, 26, 34, 0.7) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGs8XBV2fZi6e8-QthGma0tiOwZhLGAT6auFxasgCNTtR5Cq6orU94zctmvkbU-dVvsO4WpwJSgE_IK6PDLy53lootA13Z1xfUVj_F4ett8yiO8eet2DCauefjI5Of-6K6OvG9baryQiqImmosSL1g2UFDa_G9MwO7hZeLlekVvKQg_OArmlTIM3t_CBpRVGOrzpohUTC4PZHOQ1jrp0f5_N79-Vw937Hq7glszV3WhtC3l_SneUHvuX4YBhfLnQkJmN_AgJe_6c7D")' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
          <div className="flex flex-col gap-4 text-center z-10 max-w-[600px]">
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
              Nhà tài trợ & Đối tác
            </h1>
            <p className="text-gray-200 text-base md:text-lg font-normal leading-relaxed">
              Cảm ơn các đơn vị đã đồng hành cùng sự phát triển của thư viện. Sự ủng hộ của quý vị là động lực để chúng tôi mang tri thức đến gần hơn với mọi người.
            </p>
          </div>
          <button type="button" className="relative z-10 flex cursor-pointer items-center justify-center rounded-lg h-12 px-8 bg-primary hover:bg-primary/90 hover:scale-105 transition-all text-white text-base font-bold shadow-lg shadow-primary/30">
            Liên hệ tài trợ
          </button>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 lg:px-8 pb-8 md:pb-12 flex flex-col gap-10">
        <section>
          <div className="flex items-center gap-3 pb-6 pt-2">
            <div className="h-8 w-1 bg-yellow-500 rounded-full" />
            <h2 className="text-slate-900 text-[24px] font-bold leading-tight tracking-[-0.015em]">Nhà tài trợ Vàng</h2>
          </div>
          <div className="flex flex-col gap-6">
            {SPONSORS_GOLD.map((s) => (
              <div key={s.name} className="flex flex-col md:flex-row items-stretch justify-between gap-0 md:gap-6 rounded-xl bg-white overflow-hidden border border-slate-200 shadow-lg hover:border-yellow-500/50 transition-colors">
                <div className="flex flex-1 flex-col justify-between gap-6 p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded bg-yellow-50 flex items-center justify-center text-yellow-600">
                        <span className="material-symbols-outlined">{s.icon}</span>
                      </div>
                      <h3 className="text-slate-900 text-xl font-bold leading-tight">{s.name}</h3>
                    </div>
                    <p className="text-slate-600 text-sm md:text-base font-normal leading-relaxed">{s.description}</p>
                  </div>
                  <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-900 gap-2 text-sm font-medium w-fit transition-colors">
                    <span>Ghé thăm Website</span>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </button>
                </div>
                <div className="w-full md:w-[40%] min-h-[200px] md:min-h-full relative bg-cover bg-center" style={{ backgroundImage: `url("${s.image}")` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent md:bg-gradient-to-l md:from-white/50 md:to-transparent opacity-80" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 pb-6 pt-4 border-t border-slate-200 mt-4">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-slate-900 text-[22px] font-bold leading-tight tracking-[-0.015em]">Đối tác Chiến lược</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PARTNERS_STRATEGIC.map((p) => (
              <div key={p.name} className="flex flex-col gap-4 rounded-xl bg-white p-4 border border-slate-200 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-md">
                <div className="w-full aspect-video rounded-lg relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url('${p.image}')` }}>
                  <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-all" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="text-slate-900 text-lg font-bold">{p.name}</h3>
                  <p className="text-slate-600 text-sm line-clamp-3">{p.desc}</p>
                </div>
                <a className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all mt-2" href="#">
                  Xem chi tiết <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 pb-6 pt-4 border-t border-slate-200 mt-4">
            <div className="h-8 w-1 bg-gray-500 rounded-full" />
            <h2 className="text-slate-900 text-[20px] font-bold leading-tight tracking-[-0.015em]">Đối tác Cộng đồng</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {PARTNERS_COMMUNITY.map((p) => (
              <div key={p.name} className="group flex flex-col items-center justify-center gap-2 aspect-[4/3] bg-white border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-all cursor-pointer">
                <span className={`material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors`}>{p.icon}</span>
                <span className="text-slate-600 text-xs font-medium group-hover:text-primary transition-colors">{p.name}</span>
              </div>
            ))}
            <div className="group flex flex-col items-center justify-center gap-2 aspect-[4/3] bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 hover:bg-white hover:border-primary transition-all cursor-pointer">
              <span className="material-symbols-outlined text-3xl text-primary/70 group-hover:text-primary transition-colors">add</span>
              <span className="text-primary/70 text-xs font-medium group-hover:text-primary transition-colors text-center">Trở thành đối tác</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-primary/20 to-primary/10 p-8 rounded-2xl border border-primary/20 mt-8">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h3 className="text-slate-900 text-xl font-bold">Bạn muốn đồng hành cùng chúng tôi?</h3>
            <p className="text-slate-600 text-sm">Hãy cùng nhau lan tỏa tri thức và tạo ra giá trị cho cộng đồng.</p>
          </div>
          <button
            type="button"
            className="flex items-center justify-center h-10 px-6 text-white text-sm font-bold rounded-lg shadow-lg transition-all hover:opacity-90"
            style={{ backgroundColor: '#137fec', boxShadow: '0 4px 14px 0 rgba(19, 127, 236, 0.25)' }}
          >
            Liên hệ ngay
          </button>
        </div>
      </div>
    </div>
  )
}
