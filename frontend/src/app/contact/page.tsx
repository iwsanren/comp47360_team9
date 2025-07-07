"use client";

import React, { useEffect, useState } from "react";

import Image from "next/image";
import Icon from '@/components/Icon';

import { CiLocationOn, CiPhone, CiTimer } from "react-icons/ci";
import { RiTeamLine } from "react-icons/ri";

import tan from "@/assets/images/tan.png";
import Heading from "@/components/Heading";

const team = [
  { 'name': 'Martynas', 'pic': tan, title: 'Coordination lead', 'email': "martynas.kapocius@ucdconnect.ie" }, 
  { 'name': 'Neasa', 'pic': tan, title: 'Data lead', 'email': "neasa.nifhatharta2@ucdconnect.ie" },
  { 'name': 'Billie', 'pic': tan, title: 'Maintenance', 'email': "zhaofang.he@ucdconnect.ie" },
  { 'name': 'Tan', 'pic': tan, title: 'Backend lead', 'email': "hsuan-yu.tan@ucdconnect.ie" },
  { 'name': 'Prakhar', 'pic': tan, title: 'Frontend lead', 'email': "prakhar.dayal@ucdconnect.ie" },
] 

const contactInfo = [
  { title: 'Address', icon: CiLocationOn, text: 'University College Dublin, Belfield\nDublin 4, Ireland,\nEircode: D04 V1W8'},
  { title: 'Phone', icon: CiPhone, text: 'UCD phone: +353 1 716 7777'},
  { title: 'Opening Hours', icon: CiTimer, text: 'Monday - Friday: 8:00 AM - 8:00 PM\nSaturday - Sunday: 9:00 AM - 6:00 PM'},
  { title: 'Team', icon: RiTeamLine, team},
]

const ContactPage = () => {
  const [isCompleted, setComplete] = useState<boolean>(false);
  const [isDisabled, setDisabled] = useState<boolean>(true);
  const [info, setInfo] = useState<any>(false);
  useEffect(() => {}, []);
  return (
    <div className="flex-1 flex flex-col justify-center relative bg-green-300 pt-[5em]">
      <Heading className="text-center">Contact Us</Heading>
      <div className="container flex flex-col-reverse gap-8 lg:flex-row lg:gap-8">
        <div className="w-[60%] min-w-300px">
          <Heading level={2}>Get in Touch</Heading>
          {contactInfo.map(({ title, icon, text, team }, i) => (
            <div className="info-item" key={i}>
              <div className="mr-4">
                <Icon icon={icon} strokeWidth={team ? 0 : 1} size="2.5rem" />
              </div>
              <div>
                <p className="text-xl">{title}:</p>
                <div className="whitespace-pre-wrap">
                  {team ? (
                    <div className="mt-4 flex flex-wrap gap-4">
                      {team.map((member, i) => (
                        <div className="w-[48.25%]" key={i}>
                          <div className="flex gap-1 items-center">
                              <Image width={60} src={member?.pic} alt={member.name} className="team-member-photo" />
                              <p className="font-bold text-xl">{member.name}</p>
                          </div>
                          <div className="mt-2">
                            <p className="my-1 text-lg">{member.title}</p>
                            <p><a href={ `mailto:${member.email}` }>{member.email}</a></p>
                          </div>
                      </div>
                      ))}
                    </div>
                  ) : text}
                </div>
              </div>
            </div>
          ))}
      </div>
        <div className="flex-1 min-w-200px bg-white rounded-lg">
          <div className="label">
            <p>Full Name</p>
            <input name="name" />
          </div>
          <div className="label">
            <p>Email</p>
            <input
              name="email"
              type="email"
              placeholder="example3345678@xmail.com"
            />
          </div>
          <div className="label">
            <p>Phone</p>
            <input name="phone" type="phone" />
          </div>
          <div className="label">
            <p>Message</p>
            <textarea
              name="message"
              placeholder="Enter your message"
            ></textarea>
          </div>
          <p id="errorMessage"></p>
          <div className="label">
            <button
              type="submit"
              disabled={isDisabled}
              className={`px-4 py-2 rounded text-white font-semibold 
                ${
                  isDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 cursor-pointer"
                }
              `}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
      <div className={`absolute center pop-up ${isCompleted ? 'opacity-100' : 'opacity-0'}`}>
        Submission Completed
        <br />
        {"We'll inform you by email."}
      </div>
    </div>
  );
};

export default ContactPage;
