import { BadRequestException, Get, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Friendship, FriendshipStatus } from '../entities/friendship.entity';
import { UsersService } from './users.service';

@Injectable()
export class FriendshipService {
    constructor(
        @InjectRepository(Friendship) private repo: Repository<Friendship>,
        private readonly usersService: UsersService
    ) {}

    async create(applicantId: number, recipientId: number) {
        if (applicantId === recipientId) { throw new BadRequestException; }
        const applicant = await this.usersService.findById(applicantId);
        const recipient = await this.usersService.findById(recipientId);
        const friendship = this.repo.create({ applicant, recipient, status: 'pending' });
        return await this.repo.save(friendship);
    }

    async update(friendship: Friendship, status: Partial<Friendship>) {
        Object.assign(friendship, status);
        return await this.repo.save(friendship);
    }

    async remove(friendship: Friendship) {
        return await this.repo.remove(friendship);
    }

    async findByStatus(userId: number, status: FriendshipStatus) {
        const user = await this.usersService.findById(userId);
        return await this.repo.find({
            where: [
                { applicant: user, status },
                { recipient: user, status },
            ],
            relations: ['applicant', 'recipient']
        });
    }

    async oneWaySearch(applicantId: number, recipientId: number) {
        const applicant = await this.usersService.findById(applicantId);
        const recipient = await this.usersService.findById(recipientId);
        return await this.repo.findOne({
            where: [
                { applicant, recipient },
            ],
            relations: ['applicant', 'recipient']
        });
    }

    async twoWaySearch(lhsId: number, rhsId: number) {
        const lhs = await this.usersService.findById(lhsId);
        const rhs = await this.usersService.findById(rhsId);
        return await this.repo.findOne({
            where: [
                { applicant: lhs, recipient: rhs },
                { applicant: rhs, recipient: lhs },
            ],
            relations: ['applicant', 'recipient']
        });
    }
}
