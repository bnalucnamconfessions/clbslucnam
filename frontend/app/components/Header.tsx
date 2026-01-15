'use client'

export default function Header() {
  return (
    <header>
      <div>
        <div className="lg:hidden">
          <span className="material-symbols-outlined cursor-pointer">menu</span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Quản lý Thư viện</h2>
      </div>
      <div>
        <div className="relative hidden sm:block w-full max-w-xs">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 dark:text-[#92adc9]">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input 
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 bg-slate-100 dark:bg-[#233648] text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-[#92adc9] focus:ring-2 focus:ring-primary text-sm" 
            placeholder="Tìm kiếm sách, thành viên..." 
            type="text"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined text-slate-500 dark:text-[#92adc9] text-[24px] cursor-pointer">notifications</span>
            <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full"></span>
          </div>
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 cursor-pointer border border-slate-200 dark:border-[#233648]"
            style={{
              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBJyfV0KhMHXRdD3U4i0ZogpR5oKRLKNB7rHVw2S6fWnRUjXOXGFM5O9wztqAnjk1KVDMQ3bc9ZZ-X7dKZ1mDhU7N1DkBzL01J9Wtjlra0JTIlt9b2r3cfw3HjuynS6M4D0xjvGnhcdfmu6urA99SyU664RVYsgW8y4OTmNPrTgLiKhpZL5WRvfRIwLQVf9FPuSh2uhv118fgTO6-IdHPe_cFMN-sq0f8IwvNXrIJJnXaNAVxQwMAdWrYuqRf0bXnG_ECw43EF5dQjy")'
            }}
          />
        </div>
      </div>
    </header>
  )
}

